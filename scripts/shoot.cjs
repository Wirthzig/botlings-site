// usage: electron shoot.cjs <url> <out.png> <width> <height> <delayMs> <light|dark> [js]
const { app, BrowserWindow, nativeTheme } = require('electron');
const fs = require('fs');
const [url, out, w, h, delay, theme, js] = process.argv.slice(2);
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.whenReady().then(async () => {
  nativeTheme.themeSource = theme || 'light';
  const win = new BrowserWindow({ width: +w, height: +h, show: false, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setFrameRate(30);
  await win.loadURL(url);
  if (js) await win.webContents.executeJavaScript(js).catch(e => console.log('js error', e.message));
  await new Promise(r => setTimeout(r, +delay));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(out, img.toPNG());
  app.quit();
});
