# BainUltra Online Hub — Claude Code Context

## Project Overview
A static HTML website serving as an internal hub for BainUltra showroom staff.
Hosted on GitHub Pages via `rfrechette00-source/BainUltra-Online-Hub`.

## Local Setup
- Repo lives at: `/Users/Shared/BainUltra-Online-Hub/`
- Active branch: `claude/remove-exposed-api-key-ThrUa`
- Workflow: edit locally → `git commit` → `git push` → live on GitHub Pages

## Structure
```
index.html                        ← Main hub (landing page with tiles)
brand-kit/
  index.html                      ← Brand Kit landing (folder tiles)
  view/index.html                 ← Dynamic Google Drive folder viewer
  file/index.html                 ← Google Drive file viewer (iframe)
  video/index.html                ← Showroom video player (iframe)
  order-forms-product-sheets/     ← Static subfolder page
  config.js                       ← API key — GITIGNORED, local only
  config.example.js               ← Template for config.js
pricebook/index.html              ← Interactive flipbook (2026 Price List)
brochure/index.html               ← Interactive flipbook (Product Brochure)
presentation/index.html           ← Slide viewer (Product Knowledge PPT)
tools/launcher.html               ← Local terminal command launcher
```

## API Key
- `brand-kit/config.js` is gitignored and must never be committed
- It defines `var GOOGLE_API_KEY = '...'` used by the Drive viewer pages
- `config.example.js` is the committed template
- The old exposed key (`AIzaSyCCsXbhDE7YnPH6uqLtpL0U8fOrZH-DFYk`) is in git
  history and should be revoked in Google Cloud Console

## Preferences
- **Run terminal commands directly** using the Bash tool — do not ask the user
  to open Terminal manually. Claude Code's permission prompt handles approval.
- **Never commit** `brand-kit/config.js`, `.DS_Store`, or any file in `.gitignore`
- **Always push** to `claude/remove-exposed-api-key-ThrUa` unless explicitly told otherwise
- Keep changes focused — don't refactor or "improve" things outside the task scope
- When referencing a local file or folder path, make it a clickable `file://` hyperlink
  so the user can open it directly in Finder (e.g. [/Users/Shared/BainUltra-Online-Hub](file:///Users/Shared/BainUltra-Online-Hub))

## Known Issues / In Progress
- Brand Kit Google Drive folder IDs may need updating — folders not loading
- Branch `claude/remove-exposed-api-key-ThrUa` is ready to merge into `main`
