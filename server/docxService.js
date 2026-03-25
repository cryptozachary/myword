const mammoth = require("mammoth");
const sanitizeHtml = require("sanitize-html");

function countWords(text) {
  if (!text) {
    return 0;
  }

  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.length;
}

function stripText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeDocumentHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "blockquote",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "a",
      "img",
      "hr",
      "br"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"]
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer"
      })
    }
  });
}

async function parseDocxToHtml(buffer) {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement((image) =>
        image.read("base64").then((base64String) => ({
          src: `data:${image.contentType};base64,${base64String}`
        }))
      )
    }
  );

  const sanitizedHtml = sanitizeDocumentHtml(result.value || "");
  const plainText = stripText(sanitizedHtml);

  return {
    html: sanitizedHtml,
    text: plainText,
    stats: {
      wordCount: countWords(plainText),
      characterCount: plainText.length
    },
    warnings: result.messages.map((message) => message.message)
  };
}

module.exports = {
  parseDocxToHtml
};

