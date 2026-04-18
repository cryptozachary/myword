const express = require("express");
const path = require("path");

const apiRoutes = require("./routes");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use("/api", apiRoutes);
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found"
  });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled server error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`DOCX READER running at http://localhost:${port}`);
  });
}

module.exports = app;
