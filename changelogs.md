# Changelog

## 1.2.1
- Fixed the titlebar menu button not responding to taps.
- The titlebar menu now opens Community settings reliably.

## 1.2.0
- Added end-to-end encryption for relay messages.
- Room messages now use AES-256-GCM with a key derived from the room code.
- Direct messages now use ECDH P-256 key exchange plus AES-256-GCM, so only the two friends can read them.
- Presence, invites and direct messages share public keys automatically; invite messages now include the sender's secure key.
- Added 🔒 encryption indicators in room and direct-chat headers and composer hints.
- Replaced the plugin icon with a new Community Chat icon.
- Added a clear warning when encryption is unavailable on a device.

## 1.1.0
- Added preset rooms: General, AI Room, Game Room, Dev Room and Help Room.
- Added room chips for quickly switching rooms.
- Added **Lucky AI** in the AI Room, powered by the Lucky AI API. The assistant welcomes the user and replies privately on the device.
- Added photo sharing in rooms and direct chats, with automatic compression and a full-size photo viewer.
- Added an AI typing indicator and improved room names throughout the UI.
- Improved storage handling for image messages.

## 1.0.0
- Initial release of Community Chat.
- Sidebar app and quick commands.
- Unique ID generation and local storage.
- Room-based and Direct messaging support via relay.
