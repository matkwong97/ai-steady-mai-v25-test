# AI Steady Mai SG v10 — live event discovery

## Deployment
Upload the entire package to your existing GitHub repo (preserve assets). Important changed files: `app.js`, `functions/api/events.js`. Cloudflare Pages must use **Pages Functions** (not a static-only Worker or Cloudflare Workers static assets deployment).

In Cloudflare Dashboard > Workers & Pages > your **Pages** project > Settings > Variables and Secrets, add a **secret** named `TICKETMASTER_API_KEY` with a valid Ticketmaster Discovery API key, for both Production and Preview if desired. Redeploy after saving the secret. Never put this key in JavaScript, HTML or GitHub. Obtain a key from Ticketmaster Developer Portal, subject to their approval, licensing and country coverage.

The browser calls `/api/events?date=YYYY-MM-DD`. The Cloudflare Function uses the visitor's country from Cloudflare `request.cf.country` (defaults to SG if unavailable) and requests Ticketmaster live listings for that country and date. It caches results for 10 minutes. The user-entered locations still affect curated Singapore attractions, not live provider search radius. This is country-level geolocation, not precise user location; no GPS permission is requested.

IMPORTANT: Ticketmaster's coverage is uneven and some markets, including Singapore, may have few or no results. This is a genuine live provider integration, **not comprehensive Singapore events coverage**. No manual curated events are represented as verified live. If key is absent or API fails, the app keeps permanent venue suggestions and shows an explicit status. No fabricated event dates, ticket prices, or opening hours. Future work: add licensed Singapore-focused event feeds, explicit opt-in GPS radius, weather for other countries, and country-specific permanent venue catalogues.

## v11 — Wedding command centre + connected companions
- David/Winni wedding workspace: date countdown, 15 persistent checklist steps, upcoming priorities, budget allocation, guest/table capacity and seating notes, Singapore customs, ROM link, and sample day-of timeline.
- Alvin/Angie quiz signals (preferred date pace, affection, sociability and spending) influence Chia Rei/Qian Wen itinerary ranking and outfit details. No clinical or predictive personality claims.
- Age-band soft preferences influence recommendations; all activity choices remain available.
- Outfit suggestions account for the user's selected male/female friend group, weather and quiz results.
- Saved progress uses localStorage in this browser only. No sync between devices.
- Existing Cloudflare Pages functions and Ticketmaster secret configuration are unchanged.

## Deploy from GitHub
Update **app.js** and **index.html** at the repository root. Do not replace `functions/api` or `assets` if they are already deployed. Commit to `main`; Cloudflare Pages Git integration should automatically build a new deployment. Test the new wedding command centre and quiz-to-date flow in Safari. The ZIP also contains a complete backup of existing files.


## V12 friend photos and custom names
- Eight user-supplied portraits cropped into individual JPG files in assets/: women-0.jpg through women-3.jpg (Angie, Bridget, Carrie, Demi) and men-0.jpg through men-3.jpg (Alvin, Bryan, Calvin, David).
- Friends screen includes a rename panel; user names are stored in localStorage under steady_friend_names and persist on the same browser/device. Defaults can be restored. Male and female groups retain independent names.
- Existing quiz, wedding planner, events API and assets preserved. For GitHub Pages deployment, update root app.js and index.html and upload all eight new JPG files to assets/. Existing SVGs can remain.

## V13: Home dates and connected friends
- Added Stay in & cook with five home-based dates and Netflix/movie ideas.
- Quiz homebody responses and rainy weather boost home date suggestions under Surprise me.
- User may save their actual How Cook SG URL; this is a link only, not direct recipe database integration. Suggested search terms are not verified recipe matches.
- A shared context panel connects quiz insights, saved dates, milestones and wedding date across all four companions.
- Corrected social and spending quiz answer indexes.
- Existing Pages Functions and secrets remain unchanged.

## v14: Detailed date and wedding planning
- Expands v13's homebody-sensitive cooking and Netflix date suggestions, cross-companion insight panel and user-configurable How Cook SG link. No live How Cook recipe database is connected; suggestions are search terms only.
- Every dynamically ranked date itinerary now has estimated time per step and approximate activity costs in its expanded details. Event ticket prices are explicitly unknown when not provided.
- Every wedding budget category expands to show example suballocations; venue and catering section estimates per guest and per table using the saved guest count and seats per table. All are illustrative allocations, not market quotations.
- Added cross-companion insight panel to the outfit/date planner and wedding workspace.
- Escapes custom names in friend portrait alt text and major friend headings.
- Deploy: replace root `app.js` and `index.html` in GitHub. Preserve existing assets, Pages Functions, environment secrets and user browser storage.
- Outfit advice now offers a rotating second look with weather, gender-group and quiz-sensitive styling notes.

## v15: How Cook SG v35 catalogue integration
- `assets/how-cook-catalog-v35.json` contains 110 actual recipe entries extracted from the user-provided How Cook SG v35 `index.html`, including stable zero-based IDs, English/Chinese/Malay titles, cuisine, category, time and ingredients.
- Bryan/Bridget's home-date suggestions fetch this static catalogue locally and score recipes based on date type, weather and approximate prep time. They only display verified catalogue entries; no invented dish titles.
- For direct recipe links, enter your How Cook SG website URL in the date planner settings, AND deploy the companion `How-Cook-SG-v35-recipe-deeplinks.zip` update to the How Cook SG site. This adds `?recipe=NNN` deep-link support. Without the companion update, the link will not open a specific recipe.
- This is a snapshot of v35, not live syncing. Rebuild the catalogue when the cooking site changes. No paid API required.
- AI Steady Mai SG deployment: update root `app.js`, and upload `assets/how-cook-catalog-v35.json` to GitHub; other files unchanged.


## v16: Live films and nearby dining
- How Cook SG v35: 110 real recipes in `assets/how-cook-catalog-v35.json`, carried over from v15. The direct deep links require the companion How Cook SG recipe-deeplink update and its correct deployed URL.
- `functions/api/screen.js`: TMDB film and television discovery (SG Netflix provider filter; Singapore cinema now-playing). Add `TMDB_API_KEY` (TMDB v3 API key) as a Cloudflare Pages Production **Secret**, then redeploy. TMDB user ratings are shown, not Rotten Tomatoes. Netflix availability and cinema sessions should be checked independently. No paid scraping or invented titles.
- `functions/api/restaurants.js`: fetches actual OpenStreetMap restaurant/cafe entries near the proposed area via Overpass. Prices are NOT available through this source; budget influences cafe/restaurant ordering, and the UI explicitly asks users to check menus. If unavailable, a Maps search is offered.
- Date cards fetch film picks for home/movie dates and nearby restaurant candidates for other dates.
- To deploy, replace root `app.js`, upload `functions/api/screen.js` and `functions/api/restaurants.js`, and preserve the other files. For first-time v15 features also upload `assets/how-cook-catalog-v35.json` and `index.html`.


## v17: streamlined friend integration
- Removed repeated oversized “friends comparing notes” cards, redundant navigation button grids, and the duplicate quiz insight card on the date-planning page.
- Added one subtle, contextual insight strip only on the date/outfit companion page, with a single link to quiz results.
- Other friends continue to use stored preferences without displaying repeated explanatory panels.
- No API or asset changes; deploy by replacing root app.js and index.html.


## v18: streamlined date cards
- Date cards initially show only title, activity type, price, venue and a single expandable details section.
- How Cook SG recipe, nearby dining and movie recommendations load only when an itinerary is expanded.
- Streaming/cinema recommendations show one rotating title per expanded date instead of four repeated shows, with a Try another title button. Recently shown titles are stored locally per media category and avoided when alternatives exist.
- TMDB availability caveat is retained; ratings are TMDB ratings, not Rotten Tomatoes.
- No new API keys. Upload only root app.js and index.html over v17.


## v19: streamlined, linked by default
- How Cook SG site is preconfigured to https://howcooksgv8x.matkwong97.workers.dev/ without modifying the cooking site.
- Removed the standalone How Cook SG connection form from the companion page.
- Recipe cards reveal ingredients and a How Cook SG link only when the date idea is expanded.
- Existing How Cook SG website has not been verified to accept `?recipe=ID`, so links are explicitly labeled as a way to find the recipe, not guaranteed exact recipe deep links.
- v18 media title rotation and compact date cards are preserved.
- Deploy: update root app.js and index.html; preserve all other files, secrets, and assets.


## v22 update
Offline stage-aware chat with a larger curated scenario library; chat expires 24 hours after each message; users can save individual friend replies and react with a thumbs-up (male friend profiles) or heart (female friend profiles). Reactions influence local response variation for recognised topics, not model training. All stored in browser localStorage; clearing browser data removes it. No AI API required. See DEPLOY-v22.md.
