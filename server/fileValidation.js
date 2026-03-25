const path = require("path");

const DEFAULT_MAX_UPLOAD_MB = 10;
const DOCX_EXTENSION = ".docx";

const allowedMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
  "application/zip",
  "application/x-zip-compressed"
]);

function getMaxUploadBytes() {
  const configuredValue = Number(process.env.MAX_UPLOAD_MB);
  const maxMb =
    Number.isFinite(configuredValue) && configuredValue > 0
      ? configuredValue
      : DEFAULT_MAX_UPLOAD_MB;
  return Math.round(maxMb * 1024 * 1024);
}

function hasDocxExtension(fileName = "") {
  return path.extname(fileName).toLowerCase() === DOCX_EXTENSION;
}

function formatBytes(bytes) {
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

function validateUploadedFile(file, maxUploadBytes) {
  if (!file) {
    return {
      valid: false,
      code: "NO_FILE",
      message: "No file was uploaded. Please select a .docx document."
    };
  }

  if (!hasDocxExtension(file.originalname)) {
    return {
      valid: false,
      code: "INVALID_TYPE",
      message: "Unsupported file type. Please upload a .docx file."
    };
  }

  if (file.mimetype && !allowedMimeTypes.has(file.mimetype)) {
    return {
      valid: false,
      code: "INVALID_TYPE",
      message: "Invalid file format. Only .docx documents are supported."
    };
  }

  if (!file.size || file.size <= 0) {
    return {
      valid: false,
      code: "EMPTY_FILE",
      message: "The uploaded file appears to be empty."
    };
  }

  if (file.size > maxUploadBytes) {
    return {
      valid: false,
      code: "FILE_TOO_LARGE",
      message: `File is too large. Maximum size is ${formatBytes(maxUploadBytes)}.`
    };
  }

  return { valid: true };
}

module.exports = {
  allowedMimeTypes,
  formatBytes,
  getMaxUploadBytes,
  hasDocxExtension,
  validateUploadedFile
};
