const path = require("path");
const { app, BrowserWindow, shell } = require("electron");

let mainWindow;
let server;
let serverUrl;

function isInternalUrl(url) {
  return Boolean(serverUrl) && url.startsWith(serverUrl);
}

function startWebServer() {
  if (server && serverUrl) {
    return Promise.resolve(serverUrl);
  }

  const webApp = require(path.join(__dirname, "..", "server", "app"));

  return new Promise((resolve, reject) => {
    server = webApp.listen(0, "127.0.0.1", () => {
      const address = server.address();
      serverUrl = `http://127.0.0.1:${address.port}`;
      resolve(serverUrl);
    });

    server.on("error", reject);
  });
}

function stopWebServer() {
  if (!server) {
    return;
  }

  server.close();
  server = null;
  serverUrl = null;
}

async function createMainWindow() {
  const url = await startWebServer();

  mainWindow = new BrowserWindow({
    width: 1220,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    autoHideMenuBar: true,
    backgroundColor: "#f3f5f8",
    title: "DOCX READER",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (isInternalUrl(targetUrl)) {
      return { action: "allow" };
    }

    shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (!isInternalUrl(targetUrl)) {
      event.preventDefault();
      shell.openExternal(targetUrl);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(url);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopWebServer();
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});

app.whenReady().then(async () => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.docxreader.desktop");
  }

  await createMainWindow();
});
