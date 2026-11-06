/**
 * Local tests for the Community Relay Worker.
 *
 * Uses Node's built-in SQLite (Node 22.5+) as a stand-in for D1, so the
 * real SQL and the real worker code are exercised without deploying.
 *
 *   cd relay && node test.mjs
 */

import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker from "./worker.js";

const SCHEMA = readFileSync(new URL("./migrations/0001_init.sql", import.meta.url), "utf8");
const BASE = "https://relay.test";
const PREFIX = "acode-community-v1-";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  console.error("FAIL: " + message);
}

function equal(actual, expected, message) {
  assert(actual === expected, message + " (expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual) + ")");
}

class Statement {
  constructor(statement) {
    this.statement = statement;
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async run() {
    const info = this.statement.run(...this.args);
    return {
      success: true,
      meta: {
        changes: Number(info.changes || 0),
        last_row_id: Number(info.lastInsertRowid || 0)
      },
      results: []
    };
  }

  async all() {
    return { success: true, results: this.statement.all(...this.args) };
  }

  async first() {
    return this.statement.get(...this.args) || null;
  }
}

class D1 {
  constructor() {
    this.db = new DatabaseSync(":memory:");
    this.db.exec(SCHEMA);
  }

  prepare(sql) {
    return new Statement(this.db.prepare(sql));
  }
}

function makeEnv(overrides) {
  return Object.assign({
    DB: new D1(),
    TOPIC_PREFIX: PREFIX,
    KEEP_PER_TOPIC: "1000",
    MAX_BODY_BYTES: "1048576"
  }, overrides || {});
}

async function request(env, path, init) {
  const response = await worker.fetch(new Request(BASE + path, init), env);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    /* not JSON */
  }
  return { response, text, json };
}

function topic(name) {
  return PREFIX + name;
}

function envelope(id, text) {
  return JSON.stringify({
    app: "acode-community",
    v: 1,
    id: id,
    from: "CM-TEST-0001",
    name: "Tester",
    emoji: "🙂",
    type: "secure",
    ts: Date.now(),
    enc: "aes-gcm-v1",
    iv: "AAAAAAAAAAAAAAAA",
    data: text
  });
}

async function publish(env, name, body) {
  return request(env, "/" + encodeURIComponent(topic(name)), {
    method: "POST",
    body: body
  });
}

async function poll(env, name, since, limit) {
  const params = new URLSearchParams();
  params.set("poll", "1");
  params.set("since", since || "all");
  if (limit) params.set("limit", String(limit));
  const result = await request(env, "/" + encodeURIComponent(topic(name)) + "/json?" + params.toString());
  return {
    response: result.response,
    text: result.text,
    items: result.text.split("\n").filter(Boolean).map(function (line) {
      return JSON.parse(line);
    })
  };
}

/* ------------------------------------------------------------------ */

async function testHealth() {
  const env = makeEnv();
  const result = await request(env, "/v1/health");
  equal(result.response.status, 200, "health returns 200");
  equal(result.json.healthy, true, "health reports healthy");
  equal(result.json.relay, "community", "health identifies the relay");
  equal(result.response.headers.get("access-control-allow-origin"), "*", "health has CORS");
}

async function testLanding() {
  const env = makeEnv();
  const result = await request(env, "/");
  equal(result.response.status, 200, "landing page returns 200");
  assert(result.text.indexOf(BASE) !== -1, "landing page shows the relay URL");
  assert(result.text.indexOf("No per-day message quota") !== -1, "landing page mentions no daily quota");
  assert(result.text.indexOf("Advanced connection") !== -1, "landing page explains setup");
}

async function testPublishAndPoll() {
  const env = makeEnv();
  const body = envelope("msg-1", "hello");
  const sent = await publish(env, "general", body);
  equal(sent.response.status, 200, "publish returns 200");
  assert(sent.json.id && sent.json.id.charAt(0) === "m", "publish returns a message id");
  equal(sent.json.message, body, "publish echoes the exact body");

  const first = await poll(env, "general", "all");
  equal(first.response.status, 200, "poll returns 200");
  equal(first.items.length, 1, "poll returns one message");
  equal(first.items[0].message, body, "poll returns the exact body");
  equal(first.items[0].event, "message", "poll item is a message event");

  const second = await publish(env, "general", envelope("msg-2", "world"));
  assert(second.json.id !== sent.json.id, "each message gets a unique id");

  const after = await poll(env, "general", sent.json.id);
  equal(after.items.length, 1, "since=<id> returns only newer messages");
  equal(JSON.parse(after.items[0].message).id, "msg-2", "since=<id> returns the right message");

  const sinceSeconds = await poll(env, "general", String(Math.floor(Date.now() / 1000) - 60));
  equal(sinceSeconds.items.length, 2, "since=<seconds> returns recent messages");
}

async function testTrim() {
  const env = makeEnv({ KEEP_PER_TOPIC: "3" });
  for (let i = 0; i < 6; i += 1) {
    await publish(env, "trim", envelope("trim-" + i, "body-" + i));
  }
  const result = await poll(env, "trim", "all");
  equal(result.items.length, 3, "retention keeps only the newest messages");
  equal(JSON.parse(result.items[0].message).id, "trim-3", "retention keeps the right first message");
  equal(JSON.parse(result.items[2].message).id, "trim-5", "retention keeps the right last message");

  const stale = await poll(env, "trim", "msg-that-was-trimmed");
  equal(stale.items.length, 3, "unknown cursor falls back to the newest messages");
}

async function testLargeBody() {
  const env = makeEnv();
  const big = "x".repeat(300 * 1024);
  const body = envelope("big-1", big);
  const sent = await publish(env, "images", body);
  equal(sent.response.status, 200, "300 KiB body is accepted");
  const result = await poll(env, "images", "all");
  equal(result.items[0].message, body, "300 KiB body round-trips exactly");
}

async function testLimits() {
  const env = makeEnv({ MAX_BODY_BYTES: "2048" });
  const tooBig = await publish(env, "limits", "x".repeat(4096));
  equal(tooBig.response.status, 413, "oversized body returns 413");
  equal(tooBig.json.error, "message too large", "oversized body has a clear error");

  const empty = await publish(env, "limits", "");
  equal(empty.response.status, 400, "empty body returns 400");

  const badTopic = await request(env, "/not-the-right-prefix", {
    method: "POST",
    body: "hello"
  });
  equal(badTopic.response.status, 400, "topic without the app prefix is rejected");

  const badPath = await request(env, "/" + encodeURIComponent(topic("general")) + "/nope");
  equal(badPath.response.status, 404, "unknown path returns 404");
}

async function testCors() {
  const env = makeEnv();
  const options = await request(env, "/" + encodeURIComponent(topic("general")), {
    method: "OPTIONS"
  });
  equal(options.response.status, 204, "OPTIONS returns 204");
  equal(options.response.headers.get("access-control-allow-origin"), "*", "OPTIONS allows any origin");
  equal(options.response.headers.get("access-control-allow-methods").indexOf("POST") !== -1, true, "OPTIONS allows POST");

  const sent = await publish(env, "cors", envelope("cors-1", "hi"));
  equal(sent.response.headers.get("access-control-allow-origin"), "*", "POST has CORS");
  equal(sent.response.headers.get("cache-control"), "no-store", "POST is not cached");
}

async function testPrefixConfig() {
  const env = makeEnv({ TOPIC_PREFIX: "" });
  const sent = await request(env, "/anything_goes", {
    method: "POST",
    body: envelope("free-1", "hi")
  });
  equal(sent.response.status, 200, "empty TOPIC_PREFIX allows a plain topic");

  const bad = await request(env, "/bad.topic", {
    method: "POST",
    body: "hello"
  });
  equal(bad.response.status, 400, "invalid topic characters are rejected");
}

async function testIndependentTopics() {
  const env = makeEnv();
  await publish(env, "room-a", envelope("a-1", "a"));
  await publish(env, "room-b", envelope("b-1", "b"));
  const a = await poll(env, "room-a", "all");
  const b = await poll(env, "room-b", "all");
  equal(a.items.length, 1, "room A has one message");
  equal(b.items.length, 1, "room B has one message");
  equal(JSON.parse(a.items[0].message).id, "a-1", "room A has the right message");
  equal(JSON.parse(b.items[0].message).id, "b-1", "room B has the right message");
}

async function main() {
  await testHealth();
  await testLanding();
  await testPublishAndPoll();
  await testTrim();
  await testLargeBody();
  await testLimits();
  await testCors();
  await testPrefixConfig();
  await testIndependentTopics();

  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed) process.exit(1);
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
