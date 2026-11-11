# Changelog

## 1.9.4
- Added followers/following counts and follow controls in user profiles.
- Added a Community BotFather chat for creating bots, setting commands and managing tokens.
- Admin verified-badge flow reviewed.

## 1.9.2
- Users can now set the **Max claims** when creating an airdrop in a room or direct chat. The creator enters how many people may claim the airdrop; the claim card and claim checks use that limit.

## 1.9.1
- **Copy any message.** Every chat bubble now has a copy button that copies the message text, photo placeholder, token receipt or airdrop details to the clipboard.
- **View user profiles.** Tap a person's name or avatar in a room message, or the chat header in a direct chat, to open their profile. It shows their Community ID, online status, verified badge and wallet address.
- **Copy wallet addresses.** Profile windows and chat options now let you copy a user's wallet address, and save or change it for token sending.
- Wallet addresses (never private keys) are shared securely with people you chat with, so their profile can show a copyable address. A manually saved friend wallet is never overwritten.
- The APK web app received the same copy, profile and wallet-copy controls.

## 1.9.0
- Replaced the dead Thunder network with **BSC** (Binance Smart Chain, chain ID 56) in the wallet. BSC uses BNB as the native gas token; bridged USDT, USDC, BTC and ETH are supported.
- Added a **profile picture** to the wallet. Set it from a photo, or look up an NFT on-chain (paste a contract address and token ID; the plugin fetches the token URI and metadata). If none is set, a common default avatar is used.

## 1.8.0
- Added **Thunder** (ThunderCore, chain ID 108) as a second supported network in the wallet, alongside Celo. Thunder uses TT as the native gas token; bridged USDT, USDC, BTC and ETH are supported. Public preset rooms stay HDO-only on Celo; private rooms and direct chats can send the new Thunder tokens too.
- HDO remains the default token for airdrops and public-room sends.

## 1.7.0
- **Admin-granted verified badges.** The developer profile (`CM-6S29-CA2X`) can now grant or remove a verified badge for any user from **People → Verified badge**. Grants are published to a public verified list on the relay and picked up by every client, so the badge shows for everyone. Badges are no longer limited to the hardcoded developer ID.
- No other changes.

## 1.6.1
- The default relay is now the community relay at `https://community-relay.hdo-box.workers.dev`, which has no daily message limit. Existing installs that were still on `ntfy.sh` or `ntfy.envs.net` are migrated to it once. A relay you entered yourself is kept.
- New installs no longer need to change any setting to avoid the daily quota.

## 1.6.0
- **Optional self-hosted relay with no daily message limit.** Added a complete Cloudflare Workers + D1 relay in the `relay/` folder of the repository. It speaks the same protocol as the public relay, so the plugin works with either. Click the **Deploy to Cloudflare** button in `relay/README.md` and Cloudflare creates the database and deploys it for free; paste the resulting `https://…workers.dev` URL into **Me → Relay & connection → Relay server** and tap Save.
- **Relay tools in the app:** Test, Copy, Share, and Reset to default buttons in **Me → Relay & connection**, plus a **Get unlimited relay** button that opens the setup guide. Everyone you chat with must use the same relay; Share copies a short instruction message.
- **No daily quota on a self-hosted relay.** The relay stores encrypted envelopes only and keeps the newest 1,000 messages per room.
- Default relay remains `https://ntfy.envs.net` for new installs. Existing installs keep the relay they have chosen.

## 1.5.3
- **Fixed messages not sending.** The old default relay (`ntfy.sh`) allows only 250 published messages per visitor per day, and the 60-second presence ping used all of them. Once the quota ran out, every send failed with HTTP 429.
- The default relay is now **`https://ntfy.envs.net`**, a community ntfy server with a much larger daily allowance. Existing installs migrate from the old `ntfy.sh` default once; entering a relay manually in Me → Advanced still works and is kept.
- Presence now refreshes every **15 minutes** instead of every 60 seconds, and duplicate startup/focus pings are collapsed. That drops background traffic from about 1,440 messages a day to about 96.
- **Images and long messages now arrive.** ntfy stores encrypted bodies over 4,096 bytes as attachments; the receiver now downloads and decrypts those attachments instead of ignoring them.
- Relay failures are no longer hidden behind “Message saved on this phone but not sent”. The toast now shows the actual reason (quota/429, oversized message, rejected relay) and keeps the tap-to-retry action.
- No feature or data changes: rooms, private chats, E2E encryption, images, wallet tokens, airdrops and the verified badge are unchanged.

## 1.5.2
- **Mobile UI polish** for the Acode review: one consistent spacing, type and touch-target system (all primary controls are now at least 44 px), clearer contrast and fewer cramped labels.
- The top bar now shows the current room as a single tap target. Tapping it opens a **Rooms** sheet with the five preset rooms and a private-room code field, instead of silently jumping to the settings tab.
- The chat **⋯** menu now opens **Room options** for community rooms, so changing rooms, copying the room code and clearing a chat no longer leave the conversation.
- The **Me** tab was reorganised into clear cards. Backup, privacy and advanced relay settings are collapsed by default, which removes the long wall of text that made the page feel cluttered.
- The **People** tab keeps the add-friend form and contact list together; the verified-badge instructions are collapsed and the duplicate chat button on each contact row was removed.
- The welcome card is shorter and no longer says a room is "above" when the room list is below it.
- The reworked composer uses consistent icons and 44 px targets. Photo and token buttons are hidden in the AI Room instead of appearing broken, and the AI hint now states that the question is sent to the AI service.
- Room and direct-chat headers were shortened to the useful information; encryption details moved to the composer hint and the room/chat options sheet.
- Modals now open as mobile bottom sheets with full-width stacked actions, and long text, IDs and addresses wrap safely on narrow phones.
- No feature or data changes: Celo-only wallet, BTC, HDO public-room sends, private-chat tokens, airdrops and the verified badge are unchanged.

## 1.5.1
- Fixed the missing sidebar app after installation. Acode plugin IDs are lowercase; the manifest now uses `community.chat` and the plugin registers its init hook for the lowercase ID as well as the folder name Acode loads it from.
- Added a short retry when the sidebar module is not ready during startup, plus a guard against registering the sidebar twice.
- Added a **Security and privacy** section to the README so reviewers and users can see exactly what the plugin does with data and which network endpoints it contacts.
- No feature changes: Celo-only wallet, BTC, HDO public-room sends, private-chat tokens, airdrops and the verified badge are all unchanged.

## 1.5.0
- Changed the plugin ID to **community.chat** and added the GitHub repository link (`https://github.com/MrJeffAgency/Community/tree/main`) to the plugin manifest. Because the ID changed, remove the old `mrjeffagency.community` build before installing this one.
- The wallet is now **Celo only**. BNB Smart Chain, Polygon and Ethereum support were removed.
- Added **BTC** to the wallet using the Celo bridged WBTC contract `0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D` (8 decimals).
- Public preset rooms can only send **HDO** in chat. Private room codes and direct chats can send **CELO, USDT, USDC, HDO and BTC**. The wallet tab can still send every supported wallet asset, including G$.
- Added a blue **verified badge** for profile `CM-6S29-CA2X`, shown in chats, contacts and profile screens.
- Added a **Verified badge** card in the People tab with a **Message the developer** button. Users who need a badge are told to contact `CM-6S29-CA2X` and include their own profile ID.
- Added **room airdrops**: in a room or direct chat, choose Airdrop and the first person to claim gets the funds in their own wallet.
- Airdrops use a temporary claim wallet funded on-chain. The encrypted gift card contains the claim key, so it never appears in plaintext on the relay.
- Token airdrops include a native gas stipend so the claimer can move the tokens; native-coin airdrops fund the displayed amount plus a stipend.
- Added a fallback dialog that shows the claim key if the chat card cannot be posted after funding.
- Airdrops are blocked in the AI Room, and claim cards show funding and claim transaction links.
- Updated the README with airdrop usage and privacy notes.

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
