# Community Chat

Community Chat is a private, local-first chat plugin for Acode with preset rooms, a built-in AI helper, direct chats, photo sharing, token transfers, room airdrops and a built-in Celo wallet.

## Features

- **Unique ID**: Every user gets a permanent `CM-XXXX-XXXX` ID that is saved on the device.
- **Preset rooms**: Jump between General, AI Room, Game Room, Dev Room and Help Room (or type your own custom room code).
- **AI Room**: Chat with **Lucky AI**, powered by `https://luckyai-blush.vercel.app/api/chat`. The assistant welcomes you and answers questions about coding, games, school work, ideas and Acode. AI replies stay on your phone and are not posted to the relay.
- **Direct chats**: Add a friend with their Community ID to chat privately, one-to-one.
- **Photo sharing**: Send photos in rooms and direct chats. Images are compressed on the device before sending, and tapping a photo opens it full size.
- **End-to-end encryption**: Relay messages are encrypted on your device. Rooms use AES-256-GCM with a key derived from the room code; direct chats use ECDH P-256 key exchange plus AES-256-GCM.
- **Presence**: See who is online in the current room.
- **Notifications**: Get a notification when a new message arrives.
- **Celo wallet**: Every user (new and existing) gets a Celo wallet, created on the phone. The **Me** tab shows the address and live balances for **CELO**, **G$**, **USDT**, **USDC**, **HDO** and **BTC** (bridged WBTC), with copy, refresh and private-key backup.
- **Token transfers**: Send tokens to any `0x` wallet address from the wallet, or tap the 🪙 button in a room or direct chat to send and post an encrypted receipt card. Public preset rooms are HDO-only; private room codes and direct chats can send CELO, USDT, USDC, HDO and BTC. Token sending is unavailable in the AI Room.
- **Room airdrops**: In a room or direct chat, choose **Airdrop** instead of a wallet address. The plugin funds a temporary claim wallet and posts an encrypted gift card; the first person to tap **Claim to my wallet** moves the tokens to their own address. Airdrops are unavailable in the AI Room.
- **Verified badge**: Profile `CM-6S29-CA2X` is marked with a blue verified check. Anyone who needs a verified badge can message the developer at that ID from **People → Verified badge**.
- **Encrypted backup**: Export your chats, contacts and wallet key protected by a passphrase (PBKDF2 + AES-256-GCM).
- **Safety number**: In a direct chat, open Chat options and compare the safety number with your friend to confirm nobody is impersonating them.

## Rooms

| Room | Purpose |
| --- | --- |
| 💬 General | Say hello and chat with everyone |
| 🤖 AI Room | Ask Lucky AI for help |
| 🎮 Game Room | Games, tips and fun |
| 💻 Dev Room | Code and projects |
| 🛟 Help Room | Ask for help |

Tap a room chip in the **Chats** tab to switch rooms. You can also set a custom room code from the **Me** tab. Everyone who wants to chat together must use the same room code.

> Upgrading from the old `mrjeffagency.community` build? Uninstall that plugin first, then install this `Community.Chat` package. Your chats and wallet are stored under the same local key, but Acode treats the two plugin IDs as separate apps.

## Usage

1. Open the **Community** app from the sidebar.
2. Pick a room chip, or open **Me** to set a custom room code.
3. Tap **Copy invite message** in **Me** and send it to a friend. They can paste the whole invite (ID + secure key) into **People → Add contact**.
4. Tap the photo button in the composer to send an image, or the 🪙 button to send tokens — or create an airdrop — in a room or direct chat (not in the AI Room).
5. In the **AI Room**, type a question and Lucky AI will reply.

## Celo wallet

- A wallet is created automatically the first time you open v1.3.0 or newer (existing users included). The private key never leaves your phone.
- Balances are read from public Celo RPC endpoints using only your address. Celo is the only supported network.
- Supported assets are **CELO** (native), **G$**, **USDT**, **USDC**, **HDO** and **BTC** (bridged WBTC on Celo).
- G$ uses the official GoodDollar contract on Celo: `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` (18 decimals).
- USDT uses `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` and USDC uses `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` (both 6 decimals).
- BTC uses the Celo bridged WBTC contract `0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D` (8 decimals).
- HDO uses `0x0b7e844Dd950558295eB5Ee7d5f57d18c1BEeb02` on Celo by default; it can be overridden in **Token settings**.
- Already have a wallet? Tap **Import wallet** in the wallet card and paste its private key. The address and balances switch to that wallet, and your previous wallet's key stays under **Back up key**.
- Resetting your chat identity does **not** delete the wallet. Importing a backup with a different wallet keeps your current one in the key backup list.

## Sending tokens

- Tap **Send tokens** in the wallet, or the 🪙 button inside a room or direct chat.
- Choose a token, paste the recipient's `0x` wallet address, enter an amount and confirm. The transaction is signed on the phone and broadcast directly to Celo.
- In **public preset rooms** (General, Game Room, Dev Room, Help Room) only **HDO** can be sent. In **private room codes** and **direct chats** you can send **CELO, USDT, USDC, HDO or BTC**. The wallet tab can send every supported wallet asset, including G$.
- You need a small amount of **CELO** to pay the network fee. The plugin checks the fee and your token balance before signing.
- When you send from a chat, an encrypted receipt card with the amount, recipient and a block-explorer link is posted to that room or direct chat. In a direct chat you can save your friend's wallet address in **Chat options** so it is filled in automatically.
- Token sending is disabled in the **AI Room** because that room is a private conversation with Lucky AI, not with other users.
- On-chain transfers are public and irreversible, even though the chat receipt is end-to-end encrypted. Double-check the address before confirming. Lose your key and the funds are gone.

## Room airdrops

- In a room or direct chat, tap 🪙 and set **Delivery** to **Airdrop** instead of entering a wallet address.
- The plugin creates a temporary claim wallet on the phone, funds it on-chain and posts an encrypted gift card to the chat.
- For a token airdrop, the temporary wallet receives the token amount plus a small native gas stipend, so the claimer does not need gas. For a native-coin airdrop, the plugin funds the displayed amount plus a gas stipend.
- The first person to tap **Claim to my wallet** signs a transfer from the temporary wallet to their own address. Later claims fail because the pot is empty. The claim transaction link is shown on the card.
- Airdrop claim keys are inside the encrypted message payload only. They are never shown on the card or sent to the relay in plaintext. The sender can also open the fallback dialog to copy the claim key if posting the card fails.
- Airdrops are unavailable in the **AI Room**.
- Preset rooms use public room codes: anyone who knows the code can join and claim an airdrop posted there. Airdrops in preset public rooms are **HDO only**. Use a private room code for a private drop with CELO, USDT, USDC, HDO or BTC.

## Verified badge

- The developer profile `CM-6S29-CA2X` shows a blue verified check next to the name.
- If you need a verified badge, open **People → Verified badge** and tap **Message the developer**, or start a direct chat with `CM-6S29-CA2X`.
- Include your own profile ID (`CM-XXXX-XXXX`) in the message so the developer can identify you.

## Privacy

- Messages and contacts are stored locally on your device.
- Room and direct messages are delivered through a public relay (default: `ntfy.sh`), but the relay only receives **encrypted ciphertext**.
- **Rooms:** AES-256-GCM with a key derived from the room code using PBKDF2. Anyone who knows the room code can decrypt the room, so use your own private room code for sensitive conversations. The preset rooms use public codes.
- **Direct chats:** ECDH P-256 key exchange plus AES-256-GCM. Only you and your friend hold the private keys, so the relay and other users cannot read the messages.
- Your private keys (chat and wallet) stay on your phone, but they are included in exported backups so you can restore them. Backups are encrypted with a passphrase; the plain option is clearly marked unsafe. Keep backup files secret.
- If you reinstall Acode or reset your identity without a backup, old encrypted messages cannot be recovered.
- Encryption requires the device WebView to support WebCrypto. If it does not, sending is blocked instead of falling back to plaintext.
- Preset rooms use public codes, so the room header shows “public room”. Create your own room code for private groups.
- AI Room replies are stored on the device and not relayed to other users, but the text you type in the AI Room is sent to the Lucky AI server (`luckyai-blush.vercel.app`) to get an answer.
- Token receipts posted in chats are end-to-end encrypted like other messages. The blockchain transaction itself is public: the sender, recipient, amount and token are visible on the relevant chain's explorer.
- Airdrop claim keys travel inside the encrypted message payload. Whoever can decrypt the chat can claim the airdrop. Treat a public-room airdrop as a public giveaway.

## Author

MrJeffAgency — `princejeffery7214810@gmail.com` · GitHub: [MrJeffAgency](https://github.com/MrJeffAgency) · Repository: [MrJeffAgency/Community](https://github.com/MrJeffAgency/Community/tree/main)
