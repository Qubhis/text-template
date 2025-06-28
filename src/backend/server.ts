// src/server.ts
import express from "express";
import cors from "cors";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3010;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../../data");

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        dataDir: DATA_DIR,
    });
});

// API routes placeholder
app.use("/api", (req, res, next) => {
    console.log(`API request: ${req.method} ${req.path}`);
    next();
});

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

// Catch-all handler for SPA routing
app.get("", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);

    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`🌟 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
