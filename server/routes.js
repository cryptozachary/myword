const express = require("express");
const multer = require("multer");

const { parseDocxToHtml } = require("./docxService");
const {
  formatBytes,
  getMaxUploadBytes,
  validateUploadedFile
} = require("./fileValidation");

const router = express.Router();
const maxUploadBytes = getMaxUploadBytes();

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

module.exports = router;
