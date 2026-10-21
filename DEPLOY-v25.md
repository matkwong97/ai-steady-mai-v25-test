# AI Steady Mai SG v25 — Love Space pilot

## What is included
- Guest-first Daily Little Love (31 curated prompts), Couple Cards (40 curated questions), local photo scrapbook with export, and partner nickname on the Meet Your Friends page and in matching friend-chat replies.
- Optional account signup/login (email + password), D1-backed persisted Couple Link, unlink/relink, and private cross-device Love Pager (30 preset messages). Pager inbox refreshes about every 20 seconds while open.
- No OpenAI key needed.

## Important limitations
- This is a **pilot**, not a fully hardened public authentication system: signup currently does NOT verify ownership of email addresses; there is no password-reset flow, email delivery, cloud scrapbook syncing, or push notifications. Do not market these as working. Passwords are PBKDF2-hashed, but login has no effective distributed rate limiting. Consider using a managed authentication provider before inviting strangers to register.
- Signup email opt-in records a preference only. No weekly emails are sent yet.
- Scrapbook photos are device-local in IndexedDB; they are NOT backed up to Cloudflare. Use Export scrapbook to keep a copy.
- Pager messages are stored in D1 and can be read by either linked account while linked. After cutting the link, previous messages remain in the database but neither former partner can retrieve them through the pager endpoint. The message inbox refreshes while open; there is no lock-screen alert.
- Authentication tokens persist in localStorage to retain sign-in after closing the browser. Clear them by signing out. For a public launch, move to hardened httpOnly cookie sessions and email verification.

## GitHub → Cloudflare Pages setup (do not skip)
1. Back up your existing GitHub repository `matkwong97/ai-steady-mai-sg` and current Cloudflare deployment.
2. Extract this ZIP using Files on your iPhone. Upload its CONTENTS (not the ZIP itself) to the ROOT of the existing GitHub repository on `main`, preserving `functions/api/account.js`, `schema.sql`, and all other paths. Because GitHub's web uploader may not replace existing files conveniently, use a Git client or GitHub's file editor to replace changed files. An alternative is to create a NEW repository from the extracted folder and connect a new Cloudflare Pages project for staging first.
3. Cloudflare Dashboard → Workers & Pages → D1 → Create database, name `ai-steady-mai-db`.
4. Open the D1 database → Console. Paste the complete contents of `schema.sql` and execute. Verify tables `users`, `sessions`, `invites`, `pairs`, `pages`, `invite_attempts` exist.
5. Cloudflare Dashboard → Workers & Pages → your Pages project → Settings → Bindings → Add → D1 database. Set binding variable name EXACTLY `DB` and select `ai-steady-mai-db`. Save.
6. Trigger a NEW Pages deployment after the binding is saved (commit a small change to GitHub or retry/redeploy). Confirm the deployed functions are available at `/api/account?action=link` (should say `Please sign in again`, not 404 or `Database not configured`).
7. Open the live website on your phone and your partner's phone in separate browsers. Both create accounts. One generates a six-digit invite in Love Pager; the other enters it within 15 minutes. Send a preset page, check the other device's inbox (open the Love Pager or wait 20 seconds). Test cut link and a new invite. The pairing is saved in D1 and should remain after browser refresh and device restart as long as you stay signed in.
8. Test Daily Little Love, Couple Cards, scrapbook photo upload and export, partner nickname and all existing four-friend pages. Test dark mode. If something fails, revert the GitHub commit to the previous working version.

## Cloudflare cost notes
D1 and Pages Functions have free allowances subject to Cloudflare's current terms and usage. This project does not require paid AI. Email, photo cloud sync and push notifications would require further implementation and possibly additional provider charges.

## Before wider public launch
Implement email verification, password reset, robust per-IP/account rate limiting, anti-bot protection, session rotation/revocation, privacy policy, data deletion/export, and security testing of pair/unpair races. Consider managed auth rather than extending this custom pilot auth. Do not collect real users' passwords until that work is done.
