from __future__ import annotations
import os
from typing import Any, Optional
try:
    import httpx
except ImportError as exc:
    raise ImportError("The Community Bot SDK needs httpx. Install it with: pip install httpx") from exc
DEFAULT_API_URL = "https://community-bot-api.hdo-box.workers.dev"
class CommunityError(RuntimeError):
    def __init__(self, message, status=None, body=""):
        super().__init__(message)
        self.status = status
        self.body = body
class AuthError(CommunityError):
    pass
class Bot:
    def __init__(self, token, base_url=None, timeout=30.0):
        token = str(token or "").strip()
        if not token:
            raise CommunityError("A bot token is required. Get one from BotFather in Community Chat.")
        self.token = token
        self.base_url = (base_url or os.getenv("COMMUNITY_API_URL") or DEFAULT_API_URL).rstrip("/")
        self.timeout = float(timeout)
        self._client = None
    async def _http(self):
        if self._client is None:
            # Force IPv4: this host has no IPv6 route, and httpx otherwise
            # tries AAAA records first and surfaces a ConnectError.
            transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
            self._client = httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout, transport=transport, headers={"Authorization": f"Bearer {self.token}", "Accept": "application/json", "User-Agent": "community-bot-sdk/1.0"})
        return self._client
    async def _request(self, method, path, **kwargs):
        client = await self._http()
        try:
            response = await client.request(method, path, **kwargs)
        except httpx.TimeoutException as exc:
            raise CommunityError(f"The Community API timed out after {self.timeout:.0f}s.") from exc
        except httpx.RequestError as exc:
            raise CommunityError(f"Could not reach the Community API at {self.base_url}: {type(exc).__name__}") from exc
        if response.status_code in (401, 403):
            detail = response.text.strip()[:200]
            if detail.startswith("error code: 1010"):
                raise CommunityError("Cloudflare blocked this client (error 1010). Send a normal User-Agent header.")
            raise AuthError("The bot token was rejected. Create the bot again in BotFather and copy the cmb_ token.", response.status_code, detail)
        if response.status_code >= 400:
            detail = response.text.strip().replace("\n", " ")[:300]
            raise CommunityError(f"Community API returned HTTP {response.status_code}" + (f": {detail}" if detail else "."), response.status_code, detail)
        try:
            return response.json()
        except ValueError:
            return {"ok": True, "raw": response.text}
    async def close(self):
        if self._client is not None:
            await self._client.aclose()
            self._client = None
    async def get_me(self):
        data = await self._request("GET", "/v1/bots/me")
        return data.get("bot") or {}
    async def get_updates(self, offset=0, limit=50):
        data = await self._request("GET", "/v1/bots/me/getUpdates", params={"offset": max(0, int(offset)), "limit": max(1, min(100, int(limit)))})
        return list(data.get("updates") or [])
    async def send_message(self, chat_id, text):
        data = await self._request("POST", "/v1/bots/me/sendMessage", json={"chat_id": str(chat_id), "text": str(text)})
        return data.get("message") or {}
    async def set_commands(self, commands):
        data = await self._request("POST", "/v1/bots/me/commands", json={"commands": commands})
        return list(data.get("commands") or [])
    async def search(self, query):
        return await self._request("GET", "/v1/bots/me/search", params={"q": str(query)})
    async def storage(self, query=""):
        params = {"q": str(query)} if query else None
        return await self._request("GET", "/v1/bots/me/storage", params=params)
    async def save(self, content, chat_id="", user_id=""):
        return await self._request("POST", "/v1/bots/me/save", json={"content": str(content), "chat_id": str(chat_id), "user_id": str(user_id)})
