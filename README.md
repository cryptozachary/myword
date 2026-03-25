# DOCX READER

DOCX READER is a lightweight application for uploading and reading Microsoft Word `.docx` files in a clean interface.
It now runs as a standalone desktop app using Electron, while keeping the same Express + vanilla JS architecture.

## What It Does

- Uploads a `.docx` file via drag-and-drop or file picker
- Validates file type and upload size
- Converts `.docx` to HTML using Mammoth
- Sanitizes output HTML before rendering
- Displays the document in a modern reading interface
- Supports clear/reset to upload another file

## Tech Stack

- Electron (desktop shell)
- Node.js
- Express
- Mammoth
- Multer (memory upload middleware)
- sanitize-html
- Vanilla JavaScript (ES modules)
- HTML + CSS

## Why Mammoth

Mammoth is used as the primary renderer because it converts `.docx` into clean, semantic HTML suited for browser reading.
This project uses a renderer abstraction (`parseDocxToHtml`) so you can swap to `docx-preview` later if higher visual fidelity is needed.

## Install

```bash
npm install
```

## Run

Run as desktop app (recommended):

```bash
npm start
```

Alternative command:

```bash
npm run desktop
```

Run the web server only:

```bash
npm run web
```

Run web server with watch mode:

```bash
npm run web:dev
```

## Standalone Architecture

- Electron main process starts the internal Express app on an ephemeral `127.0.0.1` port.
- `BrowserWindow` loads that local URL.
- Upload and rendering flow remains unchanged from the web implementation.
- External links are opened in the system browser instead of navigating away from the app.

## Project Structure

```text
/docx-reader
  /electron
    main.js
  /public
    /css
      styles.css
    /js
      app.js
      uploader.js
      viewer.js
      state.js
    index.html
  /server
    app.js
    routes.js
    docxService.js
    fileValidation.js
  package.json
  .env.example
  README.md
```

## API Endpoint (Internal)

### `POST /api/upload-docx`

Accepts multipart upload with field name `file`.

Success response:

```json
{
  "success": true,
  "fileName": "example.docx",
  "fileSize": 14325,
  "fileSizeLabel": "14 KB",
  "html": "<h1>Example</h1>",
  "stats": {
    "wordCount": 250,
    "characterCount": 1420
  },
  "warnings": []
}
```

Error response:

```json
{
  "success": false,
  "error": "Invalid file type"
}
```

## Security and Safety Notes

- Accepts only `.docx` extension
- Validates MIME type and max upload size
- Uses in-memory uploads (no arbitrary file writes)
- Sanitizes generated HTML before DOM insertion
- Returns friendly error messages without server internals
- Electron window blocks external navigation and opens external links in system browser

## Known Limitations

- Rendering may not perfectly match Microsoft Word layout
- Complex formatting and advanced features may render imperfectly
- Intended for readable display, not pixel-perfect Word fidelity
- Legacy `.doc` files are not supported

## Future Improvements

- Add pluggable renderer support (e.g. `docx-preview`) in settings
- Add packaging pipeline for installers (`.exe`, `.dmg`, `.AppImage`)
- Dark mode theme
- Search within rendered document
- Print-friendly stylesheet
- Export sanitized HTML
- Optional client-side parsing mode
- `.doc` support via conversion pipeline
