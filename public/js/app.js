import { createUploader } from "./uploader.js";
import { createViewer } from "./viewer.js";
import { createEditor } from "./editor.js";

function getElements() {
  return {
    appShell: document.getElementById("appShell"),
    dropZone: document.getElementById("dropZone"),
    uploadPanel: document.getElementById("uploadPanel"),
    readerPanel: document.getElementById("readerPanel"),
    readerContent: document.getElementById("readerContent"),
    emptyState: document.getElementById("emptyState"),
    statusBanner: document.getElementById("statusBanner"),
    fileInput: document.getElementById("fileInput"),
    browseButton: document.getElementById("browseButton"),
    uploadAnotherButton: document.getElementById("uploadAnotherButton"),
    clearButton: document.getElementById("clearButton"),
    downloadButton: document.getElementById("downloadButton"),
    editorToolbar: document.getElementById("editorToolbar"),
    fileName: document.getElementById("fileName"),
    fileSize: document.getElementById("fileSize"),
    wordCount: document.getElementById("wordCount"),
    dirtyStatus: document.getElementById("dirtyStatus")
  };
}

function init() {
  const elements = getElements();
  const editor = createEditor({ elements });
  createUploader({ elements });
  createViewer({ elements, editor });
}

init();
