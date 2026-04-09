# Agent Handoff: Sports-Auction-Hub — Cloud to Local Migration

## What You Are Doing and Why

You are taking a GitHub Pages static website (`rfrechette00-source/Sports-auction-hub`) that currently depends on cloud/internet services (external APIs, remote-hosted files, iframes, or API keys) and making it **100% locally self-contained**. The goal is that the site runs entirely from files on disk — no external API calls, no remote content loading, no credentials required at runtime.

The cloned repository will live at `/Users/Shared/Sports-auction-hub/`. The user's GitHub account is `rfrechette00-source`. Once done, all changes are committed and pushed to a feature branch, and a PR is opened targeting `main`.

The user will not be available to answer questions. Work methodically through every phase below without stopping.

---

## Prerequisites — Verify Before Starting

1. Git is installed and authenticated for `rfrechette00-source`:

   ```bash
   git config --global user.name
   git config --global user.email
   gh auth status
   ```

   If `gh` is not authenticated, run `gh auth login` and follow prompts.

2. Python 3 is available (used for the manifest generator and preview server):

   ```bash
   python3 --version
   ```

3. The target directory does not already exist (or is empty):

   ```bash
   ls /Users/Shared/Sports-auction-hub 2>/dev/null && echo "EXISTS" || echo "CLEAR"
   ```

   If it exists and has content, stop and inspect before proceeding.

4. Port 4001 is available for the preview server (4000 may be in use by another project):
   ```bash
   lsof -i :4001 | head -3
   ```
   If 4001 is taken, pick 4002 or 4003 and use that port throughout.

---

## Phase 1 — Clone the Repository

```bash
cd /Users/Shared
git clone https://github.com/rfrechette00-source/Sports-auction-hub.git
cd Sports-auction-hub
```

Verify the clone succeeded:

```bash
git log --oneline -5
git remote -v
git branch -a
```

Note the default branch name (likely `main`). All work goes on a feature branch:

```bash
git checkout -b local-asset-migration
```

---

## Phase 2 — Full Dependency Audit

Read every HTML, JS, and config file. You are hunting for **six categories of cloud dependency**:

### 2a. API Keys and Config Files

```bash
# Find any config or key files
find . -name "config*.js" -o -name "*.env" -o -name "*.key" | grep -v node_modules | grep -v .git

# Search for API key patterns in all JS/HTML
grep -r "AIza" . --include="*.js" --include="*.html" --include="*.json" | grep -v ".git"
grep -r "api[_-]key\|apiKey\|API_KEY" . --include="*.js" --include="*.html" -i | grep -v ".git"
grep -r "Bearer \|token:" . --include="*.js" --include="*.html" -i | grep -v ".git"
```

### 2b. External API Calls (fetch/XHR)

```bash
grep -rn "fetch\s*(" . --include="*.js" --include="*.html" | grep -v ".git"
grep -rn "XMLHttpRequest\|axios\|\.get(\|\.post(" . --include="*.js" --include="*.html" | grep -v ".git"
grep -rn "googleapis\|drive\.google\|sheets\.google\|gapi\." . --include="*.js" --include="*.html" | grep -v ".git"
```

### 2c. External iframes

```bash
grep -rn "<iframe" . --include="*.html" | grep -v ".git"
```

### 2d. Hardcoded External URLs in src/href

```bash
grep -rn "src=['\"]https\?://" . --include="*.html" --include="*.js" | grep -v "fonts.googleapis\|cdn\|unpkg\|jsdelivr\|.git"
grep -rn "href=['\"]https\?://" . --include="*.html" | grep -v "fonts.googleapis\|cdn\|unpkg\|jsdelivr\|.git"
```

> Note: Font CDNs (Google Fonts, etc.) are acceptable to leave as external — they don't require credentials and work offline is not required for fonts.

### 2e. External Data Sources (JSON, CSV, etc.)

```bash
grep -rn "fetch.*http\|\.json()\|loadJSON\|getJSON" . --include="*.js" --include="*.html" | grep -v ".git"
```

### 2f. Gitignored Runtime Files

```bash
cat .gitignore 2>/dev/null
# Look for config.js, .env, credentials, or similar entries that indicate
# a file that must exist locally but was never committed
```

**Document every dependency you find.** List them before proceeding to Phase 3.

---

## Phase 3 — Download / Migrate All Assets

For each external dependency found in Phase 2, do the following:

### If the dependency is an API key + remote data source (e.g. Google Drive, Sheets, Airtable):

1. **Identify what data the API is fetching.** Read the JS code that calls the API to understand the data shape (folder listings, spreadsheet rows, file metadata, etc.).

2. **Create a local files directory:**

   ```bash
   mkdir -p assets/files
   # or whatever naming fits the project structure
   ```

3. **Download all files the API was serving.** If the user has already placed files in a known location (check if there's a folder on the Desktop or Downloads with content for this project), copy them:

   ```bash
   cp -r ~/Desktop/[source-folder]/* /Users/Shared/Sports-auction-hub/assets/files/
   ```

   If not, ask the user where the files are before proceeding.

4. **Generate a manifest.** Write a Python script at the repo root to walk the local files directory and output a JSON index the site can fetch instead of calling the API:

   ```python
   #!/usr/bin/env python3
   """Generate manifest.json from local files directory."""
   import os, json

   SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
   # *** UPDATE THIS PATH to match where the local files actually live ***
   BASE_DIR = os.path.join(SCRIPT_DIR, "assets", "files")
   SKIP = {'.DS_Store', '.url', 'Thumbs.db', 'desktop.ini'}

   def build_tree(path, rel=""):
       entries = sorted(os.listdir(path), key=lambda x: x.lower())
       children = []
       for name in entries:
           if name in SKIP or name.startswith('.'):
               continue
           full = os.path.join(path, name)
           child_rel = f"{rel}/{name}" if rel else name
           if os.path.isdir(full):
               children.append({
                   "name": name,
                   "path": child_rel,
                   "type": "folder",
                   "children": build_tree(full, child_rel)
               })
           else:
               ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
               children.append({
                   "name": name,
                   "path": child_rel,
                   "type": "file",
                   "ext": ext
               })
       return children

   root_name = os.path.basename(BASE_DIR)
   tree = {
       "name": root_name,
       "path": "",
       "type": "folder",
       "children": build_tree(BASE_DIR)
   }

   out = os.path.join(os.path.dirname(BASE_DIR), "manifest.json")
   with open(out, 'w', encoding='utf-8') as f:
       json.dump(tree, f, ensure_ascii=False, indent=2)

   def count_items(node):
       n = 0
       for c in node.get('children', []):
           n += 1
           n += count_items(c)
       return n

   print(f"Wrote {out}")
   print(f"Total items: {count_items(tree)}")
   print(f"Top-level folders: {[c['name'] for c in tree['children'] if c['type']=='folder']}")
   ```

   Run it: `python3 generate-manifest.py`

   Verify the output looks correct before continuing.

### If the dependency is external iframes (e.g. embedded Google Drive viewer, YouTube, etc.):

- **Google Drive file viewer iframe**: Replace with a local `<embed>` or `<video>` tag pointing to the downloaded file. Determine the file type and use the appropriate HTML element:
  - PDF → `<embed src="path/to/file.pdf" type="application/pdf" width="100%" height="100%">`
  - Video → `<video src="path/to/file.mp4" controls autoplay loop muted playsinline></video>`
  - Image → `<img src="path/to/file.jpg" style="width:100%;height:100%;object-fit:contain">`

- **YouTube / Vimeo**: If the video is available locally, replace with `<video>`. If not, leave the iframe but note it as an accepted external dependency (video streaming is different from data APIs).

### If the dependency is a hardcoded external file URL:

Download the file:

```bash
curl -L "https://example.com/path/to/file.ext" -o assets/files/file.ext
```

Then update the src/href to point to the local path.

### Gitignored config files:

Create them locally. For example if `config.js` was gitignored and defined an API key:

```bash
cat > config.js << 'EOF'
// Local config — do not commit
// API key removed; site now uses local files only
var CONFIG = {};
EOF
```

Then remove the `<script src="config.js">` references from HTML files since the API is no longer needed.

---

## Phase 4 — Rebuild Pages That Had Cloud Dependencies

For each HTML page that used an API or external iframe, rebuild the relevant JavaScript section to use local data instead. General pattern:

**Before (API-based):**

```js
// Old: fetch from external API
fetch("https://api.example.com/data?key=" + API_KEY)
  .then((r) => r.json())
  .then((data) => renderContent(data));
```

**After (manifest-based):**

```js
// New: fetch from local manifest
fetch("./assets/manifest.json")
  .then((r) => r.json())
  .then((data) => renderContent(data));
```

**Key principles for the rebuilt code:**

- Never use `innerHTML` with user-controlled data. Build DOM with `createElement`, `textContent`, `setAttribute`.
- URL-encode all paths before putting them in `href` or `src` attributes: `encodeURIComponent(path)`.
- Build the local file URL by concatenating a `FILE_BASE` constant + the manifest path:
  ```js
  var FILE_BASE = "./assets/files/";
  var fileUrl = FILE_BASE + encodeURIComponent(item.path).replace(/%2F/g, "/");
  // Note: only encode each segment, not the slashes
  ```
  A safer approach: just concatenate directly (the browser handles spaces and most special chars in src attributes):
  ```js
  var fileUrl = FILE_BASE + item.path;
  ```
- Cache the manifest in `window._manifest` so it's only fetched once per session.
- Handle fetch errors with a visible error message in the DOM (not just console.error).

---

## Phase 5 — Remove All Dead Code

After rebuilding:

1. Remove any `<script src="config.js">` or similar tags that loaded the API key.
2. Remove any `gapi.load()`, `gapi.client.init()`, or similar API initialization code.
3. Remove any functions that were only used for API calls (e.g., `loadDriveFolder`, `fetchSheetData`).
4. If `config.js` or `config.example.js` are in the repo, check if they're still needed. If not, leave `config.example.js` in place (it documents what the old config looked like) but ensure `config.js` is in `.gitignore`.

Verify `.gitignore` has entries for:

```
config.js
.env
*.key
.DS_Store
```

---

## Phase 6 — Update All Hardcoded Paths

After moving files to a local directory, every hardcoded path reference in HTML and JS must be updated.

**Find all hardcoded path strings:**

```bash
# Search for the old path patterns
grep -rn "files/OldFolderName\|/old-path\|old-data-source" . --include="*.html" --include="*.js" | grep -v ".git"
```

Use Python for bulk replacements when there are many occurrences (avoids running the formatter repeatedly on each Edit):

```python
import re

files = [
    'index.html',
    'viewer/index.html',
    'file-viewer/index.html',
    # add all affected files
]

replacements = [
    ('files/OldFolderName/', 'assets/files/NewFolderName/'),
    # add all replacements
]

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated: {fname}')
```

Run it: `python3 bulk-replace.py`

After running, verify the replacements were correct:

```bash
grep -rn "OldFolderName" . --include="*.html" --include="*.js" | grep -v ".git"
# Should return nothing
```

---

## Phase 7 — Local Preview and Verification

### Start the preview server

```bash
cd /Users/Shared/Sports-auction-hub
python3 -m http.server 4001
```

Leave it running in the background. Open `http://localhost:4001/` in a browser.

### Verification checklist — work through every page:

**Landing page (`/`)**

- [ ] Page loads with correct title and layout
- [ ] All navigation tiles/buttons are visible and clickable
- [ ] No console errors (open browser DevTools → Console)

**For each major section/page:**

- [ ] Navigate to it from the landing page
- [ ] Content loads (not blank, not "Loading…" spinner stuck)
- [ ] If it's a file grid/listing: folders show thumbnails (or clean dark cards), files show their type badge
- [ ] Click into a subfolder → navigates correctly, back button returns to parent
- [ ] Click a file:
  - PDF → opens in embedded viewer with Download button
  - Image → opens in lightbox or full-screen view
  - Video → plays in `<video>` player
  - Other (DOCX, ZIP, etc.) → shows download-only UI with file icon
- [ ] Download buttons work (file saves correctly)

**Network check:**

- Open browser DevTools → Network tab
- Reload the page
- Filter for "Fetch/XHR" requests
- Verify **no requests go to external APIs** (googleapis.com, airtable.com, etc.)
- All data fetches should hit `localhost:4001`

**404 check:**

- In DevTools Network tab, filter by "4xx" or sort by Status
- Any 404 means a file path is wrong — fix it before committing

### Common issues and fixes:

| Symptom                                    | Likely cause                                                              | Fix                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Files 404 even though they exist           | Path has spaces not encoded, or wrong relative depth (`../` count)        | Check the FILE_BASE constant vs. where the files actually live                            |
| Folder shows empty even though files exist | Manifest path mismatch — manifest uses different root name than FILE_BASE | Re-run `generate-manifest.py` and check the root `name` field                             |
| Video won't play                           | Browser codec issue or MIME type                                          | Try MP4 (H.264) format; Python http.server serves correct MIME types                      |
| PDF shows blank                            | Embed src path has special chars (spaces, colons) unencoded               | Set `embed.src` via JavaScript: `embed.src = FILE_BASE + path` (browser handles encoding) |
| Back button goes to wrong page             | `?parent=` / `?parentName=` params not being passed through navigations   | Trace the `href` being set on folder cards — ensure parent params are appended            |
| `window._manifest` is stale                | Hard refresh needed during dev                                            | `Ctrl+Shift+R` / `Cmd+Shift+R` to bypass cache                                            |

---

## Phase 8 — Commit and Push

Once all verification passes:

```bash
cd /Users/Shared/Sports-auction-hub

# Stage all changed files (be specific — never use git add -A blindly)
git status

# Stage files one by one or by directory
git add index.html
git add assets/
git add viewer/
git add generate-manifest.py
# etc.

# Never stage: config.js, .env, any credential file

git commit -m "Migrate site to serve all assets from local files

- Remove [describe the API/service that was removed]
- Download all [describe what files] to assets/files/
- Add generate-manifest.py to index local file tree
- Rebuild [list pages] to use manifest-based navigation
- Update all file path references to new local structure
- Remove API key dependency and config.js requirement

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push origin local-asset-migration
```

### Open the pull request:

```bash
gh pr create \
  --title "Migrate all assets to local — remove cloud API dependency" \
  --body "$(cat <<'EOF'
## Summary
- Removed dependency on [API/service name]
- All files now served locally from \`assets/files/\`
- Manifest-based file navigation replaces API calls
- No credentials or internet connection required at runtime

## Test plan
- [ ] Landing page loads
- [ ] All major sections navigate correctly
- [ ] PDFs open in embedded viewer
- [ ] Images open in lightbox
- [ ] Videos play
- [ ] Download buttons work
- [ ] No requests to external APIs in Network tab

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Phase 9 — Write CLAUDE.md for the Project

After the PR is open, create a `CLAUDE.md` at the repo root so future sessions have context:

```markdown
# Sports-Auction-Hub — Claude Code Context

## Project Overview

A static HTML website. All assets served locally from disk.
Hosted on GitHub Pages via `rfrechette00-source/Sports-auction-hub`.

## Local Setup

- Repo: `/Users/Shared/Sports-auction-hub/`
- Active branch: `local-asset-migration` (or current working branch)
- Workflow: edit locally → git commit → git push → live on GitHub Pages

## Structure

[Fill in after you read the actual file structure]

## Local File Index

- `generate-manifest.py` — regenerate `assets/manifest.json` after adding/removing files
- Run: `python3 generate-manifest.py` from repo root

## Preview Server

`python3 -m http.server 4001` from repo root → http://localhost:4001/

## Preferences

- Run terminal commands directly using the Bash tool
- Never commit config.js, .env, .DS_Store, or any file in .gitignore
- Always push to the current feature branch unless explicitly told otherwise
- Keep changes focused — don't refactor outside the task scope
```

---

## Key File Patterns Reference

These are the patterns used throughout this type of project. Use them as templates:

### Manifest-based folder renderer (JS)

```js
var FILE_BASE = "./assets/files/";
var MANIFEST_URL = "./assets/manifest.json";

// Cache manifest once
function loadManifest(callback) {
  if (window._manifest) {
    callback(window._manifest);
    return;
  }
  fetch(MANIFEST_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      window._manifest = data;
      callback(data);
    })
    .catch(function (err) {
      showError("Could not load file index: " + err.message);
    });
}

// Navigate manifest tree by path string
function getNodeAtPath(tree, path) {
  if (!path) return tree;
  var parts = path.split("/");
  var node = tree;
  for (var i = 0; i < parts.length; i++) {
    var found = null;
    for (var j = 0; j < (node.children || []).length; j++) {
      if (node.children[j].name === parts[i]) {
        found = node.children[j];
        break;
      }
    }
    if (!found) return null;
    node = found;
  }
  return node;
}
```

### File viewer page (reads ?path= param)

```js
var FILE_BASE = "../assets/files/";
var params = new URLSearchParams(window.location.search);
var filePath = params.get("path") || "";
var fileName = params.get("name") || filePath.split("/").pop() || "File";
var fileUrl = FILE_BASE + filePath;

var ext = filePath.split(".").pop().toLowerCase();
var viewer = document.getElementById("viewer");

if (ext === "pdf") {
  var embed = document.createElement("embed");
  embed.src = fileUrl;
  embed.type = "application/pdf";
  viewer.appendChild(embed);
} else if (/^(jpg|jpeg|png|gif|webp|svg)$/.test(ext)) {
  var img = document.createElement("img");
  img.src = fileUrl;
  img.alt = fileName;
  viewer.appendChild(img);
} else if (/^(mp4|mov|webm)$/.test(ext)) {
  var video = document.createElement("video");
  video.src = fileUrl;
  video.controls = true;
  video.autoplay = true;
  viewer.appendChild(video);
} else {
  // Download-only UI
  var wrap = document.createElement("div");
  wrap.className = "download-only";
  var link = document.createElement("a");
  link.href = fileUrl;
  link.setAttribute("download", fileName);
  link.textContent = "Download " + (ext ? ext.toUpperCase() + " file" : "File");
  wrap.appendChild(link);
  viewer.appendChild(wrap);
}
```

### Back-navigation pattern (preserving parent context)

```js
// Folder card navigates TO a folder, passing itself as parent context:
card.href =
  "?path=" +
  encodeURIComponent(item.path) +
  "&name=" +
  encodeURIComponent(item.name) +
  "&parent=" +
  encodeURIComponent(currentPath) +
  "&parentName=" +
  encodeURIComponent(currentName);

// File card navigates to file viewer:
card.href =
  "../file-viewer/?path=" +
  encodeURIComponent(item.path) +
  "&name=" +
  encodeURIComponent(item.name) +
  "&parent=" +
  encodeURIComponent(currentPath) +
  "&parentName=" +
  encodeURIComponent(currentName);

// Back button reads parent context:
var parentPath = params.get("parent");
var parentName = params.get("parentName") || "Home";
if (parentPath !== null) {
  backBtn.href =
    "?path=" +
    encodeURIComponent(parentPath) +
    "&name=" +
    encodeURIComponent(parentName);
}
```

---

## Summary of Everything This Migration Accomplishes

1. Repository cloned from GitHub to `/Users/Shared/Sports-auction-hub/`
2. All cloud API dependencies identified and removed
3. All assets downloaded and stored in a local directory
4. Manifest generator written and run to produce `manifest.json`
5. All viewer pages rebuilt to read from local files
6. All hardcoded remote paths replaced with local paths
7. Preview server confirmed all pages and files work correctly
8. Changes committed and pushed to `local-asset-migration` branch
9. PR opened targeting `main`
10. CLAUDE.md written so future sessions have project context

When this is done, the site is **completely self-contained** — it requires no internet connection, no API keys, and no external services to function.
