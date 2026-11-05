# Community Chat

Community Chat is a private, local-first chat plugin for Acode with preset rooms, a built-in AI helper, direct chats and photo sharing.

## Features

- **Unique ID**: Every user gets a permanent `CM-XXXX-XXXX` ID that is saved on the device.
- **Preset rooms**: Jump between General, AI Room, Game Room, Dev Room and Help Room (or type your own custom room code).
- **AI Room**: Chat with **Lucky AI**, powered by `https://luckyai-blush.vercel.app/api/chat`. The assistant welcomes you and answers questions about coding, games, school work, ideas and Acode. AI replies stay on your phone and are not posted to the relay.
- **Direct chats**: Add a friend with their Community ID to chat privately, one-to-one.
- **Photo sharing**: Send photos in rooms and direct chats. Images are compressed on the device before sending, and tapping a photo opens it full size.
- **End-to-end encryption**: Relay messages are encrypted on your device. Rooms use AES-256-GCM with a key derived from the room code; direct chats use ECDH P-256 key exchange plus AES-256-GCM.
- **Presence**: See who is online in the current room.
- **Notifications**: Get a notification when a new message arrives.
- **Backup**: Export and import your chats and contacts.

## Rooms

| Room | Purpose |
| --- | --- |
| 💬 General | Say hello and chat with everyone |
| 🤖 AI Room | Ask Lucky AI for help |
| 🎮 Game Room | Games, tips and fun |
| 💻 Dev Room | Code and projects |
| 🛟 Help Room | Ask for help |

Tap a room chip in the **Chats** tab to switch rooms. You can also set a custom room code from the **Me** tab. Everyone who wants to chat together must use the same room code.

## Usage

1. Open the **Community** app from the sidebar.
2. Pick a room chip, or open **Me** to set a custom room code.
3. Tap **Copy invite message** in **Me** and send it to a friend. They can paste the whole invite (ID + secure key) into **People → Add contact**.
4. Tap the photo button in the composer to send an image.
5. In the **AI Room**, type a question and Lucky AI will reply.

## Privacy

- Messages and contacts are stored locally on your device.
- Room and direct messages are delivered through a public relay (default: `ntfy.sh`), but the relay only receives **encrypted ciphertext**.
- **Rooms:** AES-256-GCM with a key derived from the room code using PBKDF2. Anyone who knows the room code can decrypt the room, so use your own private room code for sensitive conversations. The preset rooms use public codes.
- **Direct chats:** ECDH P-256 key exchange plus AES-256-GCM. Only you and your friend hold the private keys, so the relay and other users cannot read the messages.
- Your private key stays on your phone, but it is included in exported backups so you can restore your encrypted chats. Keep backup files secret.
- If you reinstall Acode or reset your identity without a backup, old encrypted messages cannot be recovered.
- Encryption requires the device WebView to support WebCrypto. If it does not, the composer shows a warning and messages fall back to plaintext for compatibility.
- AI Room conversations stay on the device and are not relayed to other users.

## Author

MrJeffAgency — `princejeffery7214810@gmail.com` · GitHub: [MrJeffAgency](https://github.com/MrJeffAgency)
