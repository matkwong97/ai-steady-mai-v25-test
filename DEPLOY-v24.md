# AI Steady Mai SG v24 — Eight friend invitation voices

This update changes only `friend-chat.js` from v23. It personalises the "Something to tell me?" invitation for all eight friend identities, based on relationship stage and selected male/female character set. The existing user-customised friend name still appears in the button. No API key is required.

## iPhone deployment from v23
1. Download v24 ZIP and extract it in the iPhone Files app.
2. Open https://github.com/matkwong97/ai-steady-mai-sg in Safari and sign in.
3. Select the `main` branch and open the root-level `friend-chat.js`.
4. Replace the content of `friend-chat.js` with the file from the extracted v24 folder, then commit to `main`. If GitHub's Upload files page refuses to replace an existing file, use a Git client or the GitHub web editor (pencil icon) and paste the updated file content. Do not upload the ZIP itself as a repository file.
5. Cloudflare Pages should deploy automatically from GitHub. Check Workers & Pages > your project > Deployments for Success.
6. Open https://ai-steady-mai-sg.pages.dev in a fresh Safari tab. Visit each of the four friends, then switch the selected friend gender and check the other four. Test the Text button and original functions.

If you're still on v19-v22, upload the full v24 package with folder structure preserved rather than replacing only one file.

The chat is still offline rule-based, not a generative AI model. This update changes invitation wording only; it does not alter the actual chat advice engine.
