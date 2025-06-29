// src/backend/server.ts
import express from "express";
import cors from "cors";
import path from "path";
import { FileManager } from "./utils/fileManager";
import { TemplateService } from "./services/templateService";
import { createTemplateRoutes } from "./routes/templates";

const app = express();
const PORT = process.env.PORT || 3010;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../../data");

// Initialize services
const fileManager = new FileManager(DATA_DIR);
const templateService = new TemplateService(fileManager);

// Initialize data directory on startup
async function initializeApp() {
    try {
        await fileManager.initialize();
        console.log(`✅ Data directory initialized: ${DATA_DIR}`);
    } catch (error) {
        console.error("❌ Failed to initialize data directory:", error);
        process.exit(1);
    }
}

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

// Template API routes
app.use("/api", createTemplateRoutes(templateService));

// API routes placeholder for future endpoints
app.use("/api", (req, res, next) => {
    // This will only run if no other API routes matched
    res.status(404).json({
        success: false,
        error: "API endpoint not found",
        message: `No API endpoint found for ${req.method} ${req.path}`,
    });
});

// Serve compiled JavaScript files from dist
app.use("/scripts", express.static(path.join(__dirname, "../frontend/scripts")));
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

// Start server with initialization
async function startServer() {
    await initializeApp();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 Data directory: ${DATA_DIR}`);
        console.log(`🌟 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`📋 Template API available at http://localhost:${PORT}/api/templates`);
    });
}

// Handle startup
startServer().catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
});

export default app;
