# botlings website

Two screens: a welcome, and a living botlings canvas as the end of the page. Meety offers a tour, every
bot and thing on the canvas is clickable and she explains it. Live at https://wirthzig.github.io/botlings-site/.

```bash
npm install
npm run dev       # http://localhost:5173/botlings-site/
npm run build     # notices, typecheck, static site in dist/
npx vite preview  # http://localhost:4173/botlings-site/
```

- Design: the Norn tokens of the app, Inter, flat bots, no colour except the bots.
- The avatars in src/vendor are Libraries.dev's bot-avatars (MIT, licence alongside).
- The download link (src/config.ts) points at the newest release's `botlings-arm64.dmg` in this repo. The app's `npm run publish-release` puts each release here, and installed apps update from it.
- Features, questions, what's new, privacy, imprint and notices are sheets in src/Sheets.tsx.
- scripts/shoot.cjs takes a screenshot with Electron: `<electron> scripts/shoot.cjs <url> <out.png> <width> <height> <delayMs> <light|dark> [js]`.
- Earlier designs are in Graveyard/.
- Deploys to GitHub Pages through .github/workflows/pages.yml on every push to main.
