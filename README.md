# Book Tracker – Reading Journal

Vite + React + Tailwind + Lucide. Deploys to GitHub Pages and saves your library straight to a `data/library.json` file in your repo.

## 1. Put it on GitHub using only the website (no terminal, no installs)

1. Unzip `book-tracker.zip` on your computer. You'll get a `book-tracker` folder.
2. On github.com click **+ → New repository**. Name it (e.g. `book-tracker`), choose **Public**, leave "Add a README" **unticked**, click **Create repository**.
3. On the empty repo page click **uploading an existing file** (or **Add file → Upload files**).
4. Open the unzipped folder and drag **everything inside it** (not the zip itself, not the outer folder) into the browser: `src`, `public`, `index.html`, `package.json`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, `README.md`.
   - Dragging folders keeps their sub-folders. Wait until every file shows in the list, then click **Commit changes**.
5. **Check the `src` folder arrived.** If the build fails with “Rollup failed to resolve import /src/main.jsx”, the `src` folder was not uploaded. Upload `src` again (drag the folder itself), and make sure `src/main.jsx`, `src/pages/` and `src/components/` show up in the repo.
6. **The hidden `.github` folder:** some computers hide it and it may not get picked up. After the upload, check that `.github/workflows/deploy.yml` exists in the repo. If not: **Add file → Create new file**, type the name `.github/workflows/deploy.yml` (typing the `/` creates the folders), paste the contents of `DEPLOY-WORKFLOW.yml.txt` from the zip, and commit.
7. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
8. Open the **Actions** tab. The build (`npm install` + `npm run build`) runs on GitHub's servers by itself and takes about a minute. When it's green, your site is live at `https://<username>.github.io/<repo-name>/`. If the first run happened before step 6 and failed at "deploy", click the run → **Re-run all jobs**.
9. To change anything later, edit or upload files on github.com (**Add file → Upload files**, or the pencil icon on a file). Each commit to `main` rebuilds the site automatically. There is no lockfile to maintain: the workflow uses `npm install`.

## 2. Nothing is stored on your computer

- No `localStorage`, no cookies, no IndexedDB. Books, logs, quotes, tasks and preferences exist only in the page's memory.
- **Admin:** the fine-grained GitHub token is kept in `sessionStorage` for that one tab. Closing the tab logs you out and leaves nothing behind. Log in again next time (see below).
- **Logged in as Admin:** the library is loaded from `data/library.json` when the app opens and every change is committed back to GitHub automatically. If you try to close the tab with unsaved edits, the browser warns you.
- **Guest, not logged in:** you see the demo library (or your public library, read-only). Guest edits live only in that tab and disappear on refresh. Use Admin Sync to keep anything.
- Dark/light mode and theme reset to the default on each visit, since nothing is remembered locally. (They are not part of your synced data.)

## 3. Admin login and automatic saving to GitHub

Your whole library is one JSON file in your repository (default `data/library.json`). Logged in as Admin, every change you make is committed to it automatically.

**Create the token (once)**
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → **Generate new token** (direct link: <https://github.com/settings/personal-access-tokens/new>).
2. **Repository access → Only select repositories** → pick your book-tracker repo.
3. **Permissions → Repository permissions → Contents: Read and write.** (Metadata: Read is added automatically.)
4. Generate and copy the token (`github_pat_…`). Set an expiry you're comfortable with.

**Log in (each time you open the site)**
1. Click **Admin Sync** in the header (or Preferences → GitHub Sync).
2. Enter the token, your GitHub username, repository name, branch (`main`) and file path (`data/library.json`). On a `github.io` address the username and repo are prefilled. To prefill them everywhere, fill in `public/config.json`.
3. **Log in.** The token is verified (`GET /user`), the repository and write access are checked, then the file is loaded. If the file doesn't exist yet it is created from what's on screen.

**What happens next**
- Add, edit or delete anything (books, page progress, timer sessions, quotes, notes, tasks, challenges, preferences) and the header pill shows **Saving…**, then **Synced to GitHub**. Edits are batched: a commit is made 2.5 seconds after your last change, using the file's latest `sha`. If the file was changed elsewhere, the app picks up the new `sha` and retries.
- **Sync Error** shows the reason (hover the pill, or open it). **Save Now** commits immediately; **Reload from GitHub** replaces the screen with the file as it is on GitHub.
- Commits are titled `chore: sync book tracker data [skip ci]`, so saving a book does **not** rebuild the site. Only changes to the app's code (uploads on github.com) trigger the Pages build.
- On open, the app loads the latest file, so edits from your phone and your desktop meet in the same place.
- **Log out / Clear token** forgets the token immediately. Closing the tab does the same.
- If you close the tab with unsaved changes, the browser warns you.

## 4. Visitors (read-only)

Anyone who opens the site without logging in sees **Guest Mode**. The app loads `data/library.json` from your repository (via `raw.githubusercontent.com`, with the GitHub API as fallback) and shows your live bookshelf read-only. Nothing a visitor does is saved or pushed.

- It works automatically on `https://<username>.github.io/<repo>/`. For a custom domain, fill in `public/config.json` (`owner`, `repo`, `branch`, `path`), or share `?repo=<owner>/<repo>`.
- The repository must be **public** for visitors to read it. GitHub's raw CDN can lag a minute or two behind your latest save.
- To hide your library from visitors, untick **Show my library to visitors** in the sync panel. Remember that anything in a public repo's JSON file is readable by anyone.
- Visitors can click "play with a blank demo copy" to try the app. Those changes live only in their tab.

## 5. Security notes

- The token lives in `sessionStorage` (this tab only), is sent only to `api.github.com`, and is never written into the JSON file.
- Scope it to one repository with Contents read/write only, and give it an expiry.
- Because the repo is public, your library data is public too.

## Library, series & entry features

- **New entry:** header button, a floating **+ New entry** button on every page, or press **N** (when you aren't typing in a field). Saving always gives feedback: a red toast and a highlighted Title if it's missing, or *Saved 'Title' to library*.
- **Fields:** title, author, genres (comma-separated plus tap-to-toggle pills), language, edition/format (dropdown + custom), total/current page, status (Wishlist / Bought / Currently Reading / Finished), rating 0–100 (slider + number), price with currency, notes, and year released / bought / started / finished.
- **Covers:** paste a URL or upload a file. Uploads are resized on a canvas to max 400 px wide and saved as WebP (JPEG fallback, quality 0.8), typically 5–30 KB, so `library.json` stays small.
- **Library:** live search (title, author, genre, language, notes), sort (Newest, Title, Author, Progress, Rating, Year released), filters (genre, language, status tabs) and a **Show Hidden** switch. Layouts: **Cards**, **List**, **Covers** (tap a poster to expand it inline; **Collapse** / **Collapse All**).
- **Quick page update:** type a page or tap −10 / −1 / +1 / +10, then **Save**. Reaching the last page marks it Finished; any progress on a Wishlist/Bought entry starts it.
- **No browser popups:** deleting and bulk actions use in-page confirmations (an inline *Confirm Delete?* bar or an in-app dialog) and toasts. `window.confirm` / `window.alert` are never used.
- **Series:** **Add volumes** turns any single entry into Volume 1 and opens the generator (range such as 1–70, plus extras like `0` = Prologue, `0.5` = Special Prologue, or any decimal). Volumes always sort 0, 0.5, 1, 2… The series card shows overall progress, a status-coloured volume grid, **Set as Series Cover**, bulk status for a range, add more volumes, hide/unhide and delete.
- **Same title, different editions** (e.g. Manga, Light Novel, Databook) merge into one card. The edition with the most volumes (ties: most pages) is the main one; the rest appear under **Other formats**, separated by dashed lines.

## 6. Exchange rates

Preferences → Currency & exchange rates has editable rates (units per 1 USD) and a **Refresh live rates** button (open.er-api.com). If the request fails, your saved rates are kept.

## Project layout

```
src/
  App.jsx                 shell, page switch
  lib/                    store (state + GitHub auto-save), github Contents API, currency, sample data, themes
  components/             Sidebar, Header, AddBookModal, SyncModal, TimerDock, CharacterBoard, ui kit
  pages/                  Home, Library, Shelves, WishList, Series, Collections, Journal,
                          Characters, Calendar, Challenges, Tasks, Recap, Preferences, BookDetail
public/config.json        optional visitor source
.github/workflows/deploy.yml
```

## Unified title cards

Every entry with the same title (case-insensitive, extra spaces ignored) forms one card in **Cards**, **List** and **Covers**. The largest format (most volumes, then most pages) is the main edition with bulk range status and its tile grid; other formats sit under **Other formats**, separated by dashed lines, each with its own tiles and **+ Add volumes** when it is a single entry. Search and filters match if any volume or format matches.

## Statuses, title pages, characters, tags

- **5 statuses:** Wishlist, Bought, Currently Reading, Paused, Finished. One-click buttons on cards, the volume drawer and every book page: *Start Reading*, *Pause Reading* (keeps your page), *Resume Reading*, *Mark as Finished* (jumps to the last page and records the finish date), *Read it again*. Home shows a **Paused / On Hold** pill with a one-click Resume.
- **Library cards:** coloured top border and status header (green Finished with ♥ for favourites, amber Paused, Reading with a % ring and thin bottom bar, Bought/Wishlist pills), plus a round badge on the cover corner.
- **Two levels:** click a title card to open its **Official Title page** (series cover picker, overall progress, bulk range status, Add volumes, Hide, Delete, tabs Volumes / Databooks / Light Novels / Other Formats). Click a volume to open its **book page** with breadcrumb, Prev Vol / Next Vol, status pills, 0–100 score, metadata pills, collapsible About, and Review / Quotes / Notes / Reading Log / Characters / Mood & Tropes.
- **Characters:** filter by Official Title and then by volume/edition; each card shows a volume badge. The Add/Edit modal has avatar tiles and all character fields, plus an "Unsaved changes" indicator.
- **Preferences → Tags & labels:** manage Genres, Moods, Tropes and Content warnings with live usage counts, inline rename/delete and + Add. **About** lists shortcuts: `N` add a book, `/` search, `Ctrl+Z` undo (this session only), `Esc` close.
