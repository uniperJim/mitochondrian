# mitochondrian

A small Vite + React game prototype: **Escape the Mitochondrion**.

## Run locally

Prereqs: Node.js 18+ (Node 20 recommended)

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repo is set up to deploy via **GitHub Actions** (recommended for Vite).

1. In GitHub: **Settings → Pages**
2. Under **Build and deployment** set **Source** to **GitHub Actions**
3. Push to `main`

The workflow file is: `.github/workflows/deploy-pages.yml`

Your site URL will be:

`https://uniperJim.github.io/mitochondrian/`

### Note on Pages settings

If you set Pages to **“Deploy from a branch (main / root)”**, it won’t work for a Vite build because the built site outputs to `dist/`.

## Dev notes

- The main app is rendered from `src/App.jsx`.
- Vite is configured with a production `base` of `/mitochondrian/` for GitHub Pages.

## Optional: Snyk scan

If you want Snyk Code scanning locally, authenticate first (once per machine):

```bash
snyk auth
```
