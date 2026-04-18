const express = require("express");
const multer = require("multer");

const { parseDocxToHtml } = require("./docxService");
const { htmlToDocxBuffer } = require("./docxExport");
const {
  formatBytes,
  getMaxUploadBytes,
  validateUploadedFile
} = require("./fileValidation");

const router = express.Router();
const maxUploadBytes = getMaxUploadBytes();
const MAX_EXPORT_HTML_BYTES = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes
  }
});

function getErrorStatus(code) {
  const codeToStatus = {
    NO_FILE: 400,
    EMPTY_FILE: 400,
    INVALID_TYPE: 415,
    FILE_TOO_LARGE: 413
  };

  return codeToStatus[code] || 400;
}

router.post("/upload-docx", (req, res) => {
  upload.single("file")(req, res, async (uploadError) => {
    if (uploadError) {
      if (uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          error: `File is too large. Maximum size is ${formatBytes(maxUploadBytes)}.`
        });
      }

      return res.status(400).json({
        success: false,
        error: "Upload failed. Please try a valid .docx file."
      });
    }

    const validation = validateUploadedFile(req.file, maxUploadBytes);
    if (!validation.valid) {
      return res.status(getErrorStatus(validation.code)).json({
        success: false,
        error: validation.message
      });
    }

    try {
      const parsedDocument = await parseDocxToHtml(req.file.buffer);

      if (!parsedDocument.text) {
        return res.status(422).json({
          success: false,
          error: "No readable content was found in this document."
        });
      }

      return res.json({
        success: true,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileSizeLabel: formatBytes(req.file.size),
        html: parsedDocument.html,
        stats: parsedDocument.stats,
        warnings: parsedDocument.warnings
      });
    } catch (_error) {
      return res.status(422).json({
        success: false,
        error: "Unable to parse this .docx file. It may be corrupt or unsupported."
      });
    }
  });
});

function sanitizeBaseName(fileName) {
  const raw = String(fileName || "document").replace(/\.docx$/i, "");
  const cleaned = raw.replace(/[^\w\-. ]+/g, "_").trim();
  return cleaned || "document";
}

router.post(
  "/export-docx",
  express.json({ limit: MAX_EXPORT_HTML_BYTES }),
  async (req, res) => {
    const { html, fileName } = req.body || {};

    if (typeof html !== "string" || html.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "No content to export."
      });
    }

    try {
      const baseName = sanitizeBaseName(fileName);
      const buffer = await htmlToDocxBuffer(html, { title: baseName });

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${baseName}-edited.docx"`,
        "Content-Length": buffer.length
      });
      return res.send(buffer);
    } catch (error) {
      console.error("DOCX export failed:", error);
      return res.status(500).json({
        success: false,
        error: "Unable to build .docx from the edited content."
      });
    }
  }
);

module.exports = router;
