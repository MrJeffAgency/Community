# Changelog

## 1.4.0
- The wallet now shows balances on **Celo**, **BNB Smart Chain**, **Polygon** and **Ethereum** from one address.
- Added **G$ (GoodDollar)** balances on Celo and Ethereum, plus USDT/USDC on every supported network and HDO on Celo.
- You can now **send tokens** to any 0x wallet address directly from the wallet. Transfers are signed on the phone and broadcast to the selected network; the private key never leaves the device.
- Added a coin button in rooms and direct chats to send tokens and post an encrypted receipt card with the amount, recipient and transaction link.
- Token sending is disabled in the AI Room.
- You can save a friend's wallet address in Chat options so it is filled in automatically when sending tokens in a direct chat.
- Added live fee checks, token balance checks and clear errors before a transfer is signed.
- Updated the README and privacy notes for multi-chain balances and on-chain transfers.

## 1.3.0
- Added a built-in Celo (EVM) wallet for every user. New users get one on first launch and existing users get one automatically when they update.
- The Me tab shows the wallet address with live CELO, HDO and USDT balances, plus copy, refresh, private-key backup and HDO token settings.
- Users can import an existing wallet by pasting its private key; the previous wallet is kept in the key backup list.
- Passphrase-encrypted backups (PBKDF2 + AES-256-GCM); the plain backup is now labelled unsafe. Backups include the wallet key.
- Importing a backup keeps your current wallet if the backup has a different one or none; resetting identity never deletes the wallet.
- Messages are no longer sent as plaintext when WebCrypto is unavailable; sending is blocked with a clear message.
- Added safety numbers in direct-chat options so friends can verify each other's keys.
- Preset rooms now show “public room” in the header; the privacy notes explain that text typed in the AI Room is sent to the Lucky AI server.
- Capped auto-added contacts to stop spam from filling local storage.

## 1.2.6
- Version bump for plugin store resubmission.
- Fixed the titlebar menu button not responding to taps.
- The titlebar menu now opens Community settings reliably.
- Rebuilt the installable package.

## 1.2.1
- Internal build with the titlebar menu fix; superseded by 1.2.6.

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
