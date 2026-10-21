# v23 Dark-mode contrast fix
This is a complete website ZIP built on v22, with only dark-mode readability fixes.

If your GitHub repository is already running v22:
1. In iPhone Files, unzip this ZIP.
2. In your existing GitHub repository on `main`, update **only the root `index.html`** from the extracted ZIP. All other files are unchanged.
3. Commit to `main`; your connected Cloudflare Pages project should automatically deploy.
4. In Safari open the live site and check the personality-insights strip in dark and day mode.

The fix adds a dark-mode background and high-contrast text for `.context-strip`, including its secondary text and View insights link. It also clarifies dark-mode text colors for the insight, event and invitation cards.

If you are on v19 or v21, upload the complete v23 project preserving folder paths instead of only index.html.
