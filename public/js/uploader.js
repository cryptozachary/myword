import { getState, setState, UI_STATES } from "./state.js";

async function sendFile(file) {
  const payload = new FormData();
  payload.append("file", file);

  const response = await fetch("/api/upload-docx", {
    method: "POST",
    body: payload
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.success) {
    throw new Error(body.error || "Unable to upload the selected file.");
  }

  return body;
}

function isDocx(file) {
  return file && /\.docx$/i.test(file.name);
}

function formatClientBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function createUploader({ elements }) {
  const {
    appShell,
    dropZone,
    fileInput,
    browseButton,
    uploadAnotherButton,
    newDocumentButton,
    clearButton
  } = elements;

  async function uploadFile(file) {
    const { isLoading } = getState();
    if (isLoading) {
      return;
    }

    if (!file) {
      setState({
        error: "No file selected.",
        uiState: UI_STATES.ERROR,
        isLoading: false,
        isDragging: false
      });
      return;
    }

    if (!isDocx(file)) {
      setState({
        error: "Only .docx files are supported.",
        uiState: UI_STATES.ERROR,
        isLoading: false,
        isDragging: false
      });
      return;
    }

    const previousState = getState();

    setState({
      currentFile: {
        name: file.name,
        size: file.size,
        sizeLabel: formatClientBytes(file.size)
      },
      error: null,
      isLoading: true,
      isDragging: false,
      uiState: UI_STATES.LOADING
    });

    appShell.classList.add("is-loading");

    try {
      const data = await sendFile(file);
      setState({
        currentFile: {
          name: data.fileName,
          size: data.fileSize,
          sizeLabel: data.fileSizeLabel
        },
        renderedHtml: data.html,
        stats: data.stats,
        error: null,
        isLoading: false,
        isDragging: false,
        isDirty: false,
        uiState: UI_STATES.SUCCESS
      });
    } catch (error) {
      setState({
        currentFile: previousState.currentFile,
        renderedHtml: previousState.renderedHtml,
        stats: previousState.stats,
        error: error.message || "Something went wrong while reading this document.",
        isLoading: false,
        isDragging: false,
        uiState: UI_STATES.ERROR
      });
    } finally {
      appShell.classList.remove("is-loading");
      fileInput.value = "";
    }
  }

  function setDragging(isDragging) {
    const { isLoading } = getState();
    if (isLoading) {
      return;
    }

    setState({
      isDragging,
      uiState: isDragging ? UI_STATES.DRAGGING : UI_STATES.IDLE,
      error: null
    });
  }

  function onFileInputChange(event) {
    const [file] = event.target.files || [];
    uploadFile(file);
  }

  function onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);

    const [file] = event.dataTransfer?.files || [];
    uploadFile(file);
  }

  function openFileDialog() {
    const { isLoading } = getState();
    if (!isLoading) {
      fileInput.click();
    }
  }

  function newDocument() {
    const { isLoading, isDirty } = getState();
    if (isLoading) {
      return;
    }

    if (isDirty && !window.confirm("Discard unsaved changes and start a new document?")) {
      return;
    }

    setState({
      currentFile: {
        name: "Untitled.docx",
        size: 0,
        sizeLabel: "-"
      },
      renderedHtml: "<p></p>",
      stats: { wordCount: 0, characterCount: 0 },
      error: null,
      isLoading: false,
      isDragging: false,
      isDirty: false,
      uiState: UI_STATES.SUCCESS
    });

    fileInput.value = "";
  }

  function clearDocument() {
    const { isLoading } = getState();
    if (isLoading) {
      return;
    }

    setState({
      currentFile: null,
      renderedHtml: "",
      stats: null,
      error: null,
      isLoading: false,
      isDragging: false,
      isDirty: false,
      uiState: UI_STATES.EMPTY
    });

    fileInput.value = "";
  }

  dropZone.addEventListener("click", openFileDialog);
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFileDialog();
    }
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  });

  dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  });

  dropZone.addEventListener("drop", onDrop);
  fileInput.addEventListener("change", onFileInputChange);
  browseButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openFileDialog();
  });
  uploadAnotherButton.addEventListener("click", openFileDialog);
  newDocumentButton.addEventListener("click", newDocument);
  clearButton.addEventListener("click", clearDocument);

  return {
    uploadFile,
    newDocument,
    clearDocument
  };
}
