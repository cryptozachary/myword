import { subscribe, UI_STATES } from "./state.js";

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat().format(value);
}

export function createViewer({ elements }) {
  const {
    dropZone,
    uploadPanel,
    readerPanel,
    readerContent,
    emptyState,
    statusBanner,
    fileName,
    fileSize,
    wordCount,
    uploadAnotherButton,
    clearButton
  } = elements;

  subscribe((state) => {
    const hasDocument = Boolean(state.renderedHtml);

    dropZone.classList.toggle("is-dragging", state.isDragging && !state.isLoading);

    uploadAnotherButton.disabled = state.isLoading;
    clearButton.disabled = state.isLoading || !hasDocument;

    if (state.error) {
      statusBanner.textContent = state.error;
      statusBanner.classList.remove("hidden", "is-loading", "is-success");
      statusBanner.classList.add("is-error");
    } else if (state.isLoading) {
      statusBanner.textContent = "Reading document...";
      statusBanner.classList.remove("hidden", "is-error", "is-success");
      statusBanner.classList.add("is-loading");
    } else if (state.uiState === UI_STATES.SUCCESS && hasDocument) {
      statusBanner.textContent = "Document loaded successfully.";
      statusBanner.classList.remove("hidden", "is-error", "is-loading");
      statusBanner.classList.add("is-success");
    } else {
      statusBanner.classList.add("hidden");
      statusBanner.classList.remove("is-error", "is-loading", "is-success");
      statusBanner.textContent = "";
    }

    if (hasDocument) {
      uploadPanel.classList.add("hidden");
      emptyState.classList.add("hidden");
      readerPanel.classList.remove("hidden");
      readerContent.innerHTML = state.renderedHtml;

      fileName.textContent = state.currentFile?.name || "-";
      fileSize.textContent = state.currentFile?.sizeLabel || "-";
      wordCount.textContent = formatNumber(state.stats?.wordCount);
      return;
    }

    readerPanel.classList.add("hidden");
    readerContent.innerHTML = "";
    fileName.textContent = "-";
    fileSize.textContent = "-";
    wordCount.textContent = "-";

    if (state.uiState === UI_STATES.LOADING) {
      uploadPanel.classList.remove("hidden");
      emptyState.classList.add("hidden");
      return;
    }

    uploadPanel.classList.remove("hidden");
    emptyState.classList.remove("hidden");
  });
}
