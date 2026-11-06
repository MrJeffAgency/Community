# Security and privacy

Community Chat is a local-first Acode plugin. This document explains exactly what it stores, what it sends, and what it never does. It is written so a store reviewer can check the claims against `main.js`.

## Data stored on the device

All plugin data lives in `localStorage` under the key `acode.community.chat.v1`:

- chats and message history
- contacts and saved wallet addresses
- settings (room code, relay URL, HDO token contract)
- the chat identity private key (ECDH P-256)
- the Celo wallet private key and any imported wallet archive

Nothing is uploaded to a developer server. There is no account system, no analytics, no advertising SDK and no tracking.

## Network endpoints

| Endpoint | What is sent | When |
| --- | --- | --- |
| `https://community-relay.hdo-box.workers.dev` (default) | Encrypted message envelopes, presence pings, public keys, and download of attachment-backed messages you receive | When sending a message or while the app is open |
| `https://ntfy.envs.net`, `https://ntfy.sh` | Same as above (legacy default relays with a daily quota) | Only on builds before 1.6.1 |
| `https://luckyai-blush.vercel.app/api/chat` | Only the text typed in the AI Room | When you ask Lucky AI a question |
| `https://forno.celo.org`, `https://celo-rpc.publicnode.com` | Public wallet address reads and signed transactions | When loading balances or sending funds |
| `https://mainnet-rpc.thundercore.com`, `https://mainnet-rpc.thundertoken.net`, `https://mainnet-rpc.thundercore.io` | Public wallet address reads and signed transactions on Thunder | When loading balances or sending funds on Thunder |
| `https://celoscan.io` | Nothing (opened as a normal link) | When you tap a transaction link |
| `https://github.com/MrJeffAgency/Community` | Nothing (opened as a normal link) | When you tap **Get unlimited relay** in Me |

The `relay/` folder in this repository is a self-hostable Cloudflare Worker + D1 relay that speaks the same protocol. A relay stores encrypted envelopes plus routing metadata (Community ID, display name, emoji, public key, timestamp). Message text, images, token receipts and airdrop claim keys are encrypted on the device before they reach the relay. Anyone who knows a public room code can decrypt that room, which is why private room codes are recommended for sensitive conversations.

## Code execution

- The plugin is plain JavaScript in `main.js`. It does not download, `eval`, or execute remote code.
- The only dynamically loaded file is the local `style.css` that ships in the same package.
- No shell commands, file-system access, or background services are used.

## Wallet

- The wallet private key is generated on the phone with `crypto.getRandomValues`.
- The key is never transmitted to the relay, to other users, to Lucky AI, or to a developer server.
- Transfers are signed locally with a pure-JavaScript secp256k1 implementation. Only the signed raw transaction is broadcast to Celo.
- Airdrops use a temporary wallet. Its key is placed only inside the encrypted chat payload; it is never written to the card or uploaded in plaintext.
- Transactions are public on the Celo blockchain even though the chat receipt is encrypted.

## Encryption

- Rooms: AES-256-GCM with a PBKDF2-SHA-256 key derived from the room code (120,000 iterations).
- Direct chats: ECDH P-256 key agreement plus AES-256-GCM.
- Images: compressed on the device and encrypted with the same message envelope.
- If WebCrypto is unavailable, sending is blocked instead of falling back to plaintext.

## Backups

Exported backups are encrypted with PBKDF2 + AES-256-GCM. A plain-text backup option exists and is clearly marked unsafe. Backup files contain the chat identity key and the wallet key, so they should be kept private.

## Verifying a build

The source is published at <https://github.com/MrJeffAgency/Community/tree/main>. The installable zip contains only:

- `plugin.json`
- `main.js`
- `style.css`
- `readme.md`
- `changelogs.md`
- `icon.png`

You can compare those files with the repository, or rebuild the zip from the source.
