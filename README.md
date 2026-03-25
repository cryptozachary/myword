# DOCX READER

DOCX READER is a lightweight web application for uploading and reading Microsoft Word `.docx` files in the browser.
It prioritizes clean readability, fast load times, and simple UX over heavy framework complexity.

## What It Does

- Uploads a `.docx` file via drag-and-drop or file picker
- Validates file type and upload size
- Converts `.docx` to HTML using Mammoth
- Sanitizes output HTML before rendering
- Displays the document in a modern reading interface
- Supports clear/reset to upload another file

## Tech Stack

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

## Run Locally

1. Optional: copy `.env.example` values into your shell environment.
2. Start the app:

```bash
npm start
```

3. Open:

```text
http://localhost:3000
```

For auto-reload on backend changes:

```bash
npm run dev
```

## Project Structure

```text
/docx-reader
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

## API Endpoint

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

## Known Limitations

- Rendering may not perfectly match Microsoft Word layout
- Complex formatting and advanced features may render imperfectly
- Intended for readable browser display, not pixel-perfect Word fidelity
- Legacy `.doc` files are not supported

## Future Improvements

- Add pluggable renderer support (e.g. `docx-preview`) in settings
- Dark mode theme
- Search within rendered document
- Print-friendly stylesheet
- Export sanitized HTML
- Optional client-side parsing mode
- `.doc` support via conversion pipeline
