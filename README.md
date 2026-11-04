# botlings website

The page is the botlings canvas: a bot waits above the input, takes a job (typed by you, or by the page
after a moment), hops to its folder, works, comes back and answers with what botlings is and the download.

```bash
npm install
npm run dev       # http://localhost:5173/botlings/
npm run build     # notices, typecheck, static site in dist/
```

- Design: the Norn tokens of the app, Inter, no colour except the bots. Plan in the app repo, docs/Website-Plan.md.
- The avatars in src/vendor are Libraries.dev's bot-avatars (MIT, licence alongside).
- The download link (src/config.ts) points at the newest release's `botlings-arm64.dmg` in the public repo.
- Deploys to GitHub Pages through .github/workflows/pages.yml once this is a public repo.
