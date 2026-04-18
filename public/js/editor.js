import { getState, setState } from "./state.js";
import {
  Editor,
  StarterKit,
  Image
} from "./vendor/tiptap.bundle.js";

function stripDocxExtension(name) {
  return name.replace(/\.docx$/i, "");
}

function htmlToFallbackDoc(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  const blocks = Array.from(tmp.children)
    .map((el) => {
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || "").replace(/\u0000/g, "");
      const textNode = text ? [{ type: "text", text }] : [];
      if (/^h[1-6]$/.test(tag)) {
        const level = Math.min(3, Math.max(1, parseInt(tag[1], 10) || 1));
        return { type: "heading", attrs: { level }, content: textNode };
      }
      if (tag === "blockquote") {
        return {
          type: "blockquote",
          content: [{ type: "paragraph", content: textNode }]
        };
      }
      if (tag === "hr") {
        return { type: "horizontalRule" };
      }
      return { type: "paragraph", content: textNode };
    })
    .filter(Boolean);
  return {
    type: "doc",
    content: blocks.length ? blocks : [{ type: "paragraph" }]
  };
}

function buildDownloadName(fileName) {
  const base = fileName ? stripDocxExtension(fileName) : "document";
  return `${base}-edited.docx`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function countWords(text) {
  if (!text) {
    return 0;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const TOGGLE_COMMANDS = {
  bold: (chain) => chain.toggleBold(),
  italic: (chain) => chain.toggleItalic(),
  underline: (chain) => chain.toggleUnderline(),
  strike: (chain) => chain.toggleStrike(),
  bulletList: (chain) => chain.toggleBulletList(),
  orderedList: (chain) => chain.toggleOrderedList(),
  blockquote: (chain) => chain.toggleBlockquote(),
  codeBlock: (chain) => chain.toggleCodeBlock(),
  paragraph: (chain) => chain.setParagraph(),
  h1: (chain) => chain.toggleHeading({ level: 1 }),
  h2: (chain) => chain.toggleHeading({ level: 2 }),
  h3: (chain) => chain.toggleHeading({ level: 3 }),
  undo: (chain) => chain.undo(),
  redo: (chain) => chain.redo(),
  hr: (chain) => chain.setHorizontalRule()
};

const ACTIVE_CHECKS = {
  bold: (editor) => editor.isActive("bold"),
  italic: (editor) => editor.isActive("italic"),
  underline: (editor) => editor.isActive("underline"),
  strike: (editor) => editor.isActive("strike"),
  bulletList: (editor) => editor.isActive("bulletList"),
  orderedList: (editor) => editor.isActive("orderedList"),
  blockquote: (editor) => editor.isActive("blockquote"),
  codeBlock: (editor) => editor.isActive("codeBlock"),
  h1: (editor) => editor.isActive("heading", { level: 1 }),
  h2: (editor) => editor.isActive("heading", { level: 2 }),
  h3: (editor) => editor.isActive("heading", { level: 3 })
};

export function createEditor({ elements }) {
  const { readerContent, editorToolbar, downloadButton } = elements;

  const toolbarButtons = Array.from(
    editorToolbar.querySelectorAll("button[data-cmd]")
  );

  let editorInstance = null;
  let isApplyingContent = false;

  function refreshActiveStates() {
    if (!editorInstance) {
      return;
    }
    toolbarButtons.forEach((button) => {
      const cmd = button.dataset.cmd;
      const check = ACTIVE_CHECKS[cmd];
      button.classList.toggle(
        "is-active",
        Boolean(check && check(editorInstance))
      );
    });
  }

  editorInstance = new Editor({
    element: readerContent,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false
      }),
      Image.configure({ inline: false, allowBase64: true })
    ],
    content: "",
    editable: false,
    onUpdate: ({ editor: instance }) => {
      if (isApplyingContent) {
        return;
      }
      const state = getState();
      const text = instance.getText();
      setState({
        isDirty: true,
        stats: {
          ...(state.stats || {}),
          wordCount: countWords(text),
          characterCount: text.length
        }
      });
      refreshActiveStates();
    },
    onSelectionUpdate: refreshActiveStates
  });

  function runCommand(cmd) {
    const apply = TOGGLE_COMMANDS[cmd];
    if (!apply) {
      return;
    }
    apply(editorInstance.chain().focus()).run();
  }

  function handleToolbarClick(event) {
    const button = event.target.closest("button[data-cmd]");
    if (!button || button.disabled) {
      return;
    }
    event.preventDefault();

    if (button.dataset.cmd === "link") {
      handleLinkClick();
      return;
    }

    runCommand(button.dataset.cmd);
  }

  function handleLinkClick() {
    const previousHref = editorInstance.getAttributes("link").href || "";
    const input = window.prompt("Enter URL (blank to remove):", previousHref);
    if (input === null) {
      return;
    }
    const chain = editorInstance.chain().focus().extendMarkRange("link");
    if (input.trim() === "") {
      chain.unsetLink().run();
      return;
    }
    chain.setLink({ href: input.trim() }).run();
  }

  async function handleDownload() {
    const state = getState();
    if (!state.currentFile) {
      return;
    }
    const html = editorInstance.getHTML();
    downloadButton.disabled = true;
    const previousText = downloadButton.textContent;
    downloadButton.textContent = "Exporting...";
    try {
      const response = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          fileName: state.currentFile.name
        })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "DOCX export failed.");
      }
      const blob = await response.blob();
      downloadBlob(blob, buildDownloadName(state.currentFile.name));
      setState({ isDirty: false });
    } catch (error) {
      setState({ error: error.message || "DOCX export failed." });
    } finally {
      downloadButton.textContent = previousText;
      downloadButton.disabled = false;
    }
  }

  function warnBeforeUnload(event) {
    if (getState().isDirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  editorToolbar.addEventListener("click", handleToolbarClick);
  downloadButton.addEventListener("click", handleDownload);
  window.addEventListener("beforeunload", warnBeforeUnload);

  return {
    setContent(html) {
      const incoming = html || "";
      isApplyingContent = true;
      try {
        try {
          editorInstance.commands.setContent(incoming, { emitUpdate: false });
        } catch (error) {
          console.warn(
            "[editor.setContent] HTML parser failed, falling back to plain-text JSON doc:",
            error
          );
          const doc = htmlToFallbackDoc(incoming);
          editorInstance.commands.setContent(doc, { emitUpdate: false });
        }
        editorInstance.setEditable(Boolean(incoming));
        refreshActiveStates();
      } finally {
        isApplyingContent = false;
      }
    },
    clear() {
      const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
      isApplyingContent = true;
      try {
        try {
          editorInstance.commands.setContent(emptyDoc, { emitUpdate: false });
        } catch (error) {
          console.warn("[editor.clear] setContent(empty doc) failed:", error);
        }
        editorInstance.setEditable(false);
        refreshActiveStates();
      } finally {
        isApplyingContent = false;
      }
    },
    getEditor() {
      return editorInstance;
    }
  };
}
