const HTMLtoDOCX = require("html-to-docx");
const sanitizeHtml = require("sanitize-html");

const SANITIZE_OPTIONS = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "blockquote", "pre", "code",
    "ul", "ol", "li",
    "strong", "em", "u", "s", "br", "hr",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "a", "img", "span", "div"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "name"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    "*": ["class", "style"]
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"]
  }
};

function wrapHtmlForDocx(bodyHtml, title) {
  const safeTitle = title ? String(title).replace(/[<>&]/g, "") : "Document";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${safeTitle}</title></head><body>${bodyHtml}</body></html>`;
}

async function htmlToDocxBuffer(rawHtml, { title } = {}) {
  const cleanedHtml = sanitizeHtml(rawHtml || "", SANITIZE_OPTIONS);
  const wrapped = wrapHtmlForDocx(cleanedHtml, title);

  const result = await HTMLtoDOCX(wrapped, null, {
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false
  });

  if (Buffer.isBuffer(result)) {
    return result;
  }

  if (result && typeof result.arrayBuffer === "function") {
    return Buffer.from(await result.arrayBuffer());
  }

  return Buffer.from(result);
}

module.exports = {
  htmlToDocxBuffer
};
