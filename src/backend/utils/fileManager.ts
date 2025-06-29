import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

/**
 * Simple utility for JSON file operations with file system error handling
 */
export class FileManager {
    private dataDir: string;
    private templatesDir: string;

    constructor(dataDir: string = "./data") {
        this.dataDir = path.resolve(dataDir);
        this.templatesDir = path.join(this.dataDir, "templates");
    }

    /**
     * Initialize the data directory structure
     */
    async initialize(): Promise<void> {
        try {
            await this.ensureDirectoryExists(this.dataDir);
            await this.ensureDirectoryExists(this.templatesDir);

            // Initialize categories.json if it doesn't exist
            const categoriesPath = this.getCategoriesPath();
            if (!existsSync(categoriesPath)) {
                await this.writeJsonFile(categoriesPath, { categories: [] });
            }
        } catch (error) {
            throw this.createFileSystemError(error, "initialize data directory");
        }
    }

    /**
     * Read and parse a JSON file
     */
    async readJsonFile<T>(filePath: string): Promise<T> {
        try {
            const content = await fs.readFile(filePath, "utf8");
            return JSON.parse(content);
        } catch (error) {
            throw this.createFileSystemError(error, `read file: ${filePath}`);
        }
    }

    /**
     * Write data to a JSON file
     */
    async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
        try {
            await this.ensureDirectoryExists(path.dirname(filePath));
            const content = JSON.stringify(data, null, 2);
            await fs.writeFile(filePath, content, "utf8");
        } catch (error) {
            throw this.createFileSystemError(error, `write file: ${filePath}`);
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            const nodeError = error as NodeJS.ErrnoException;
            if (nodeError.code === "ENOENT") {
                return; // File doesn't exist, that's fine for delete
            }
            throw this.createFileSystemError(error, `delete file: ${filePath}`);
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            const nodeError = error as NodeJS.ErrnoException;
            if (nodeError.code === "ENOENT") {
                return false;
            }
            // For permission errors, we should throw
            throw this.createFileSystemError(error, `check file existence: ${filePath}`);
        }
    }

    /**
     * List JSON files in templates directory
     */
    async listTemplateFiles(): Promise<string[]> {
        try {
            const files = await fs.readdir(this.templatesDir);
            return files.filter((file) => file.endsWith(".json"));
        } catch (error) {
            const nodeError = error as NodeJS.ErrnoException;
            if (nodeError.code === "ENOENT") {
                return []; // Directory doesn't exist, return empty array
            }
            throw this.createFileSystemError(error, `list template files`);
        }
    }

    /**
     * Get path for a template file
     */
    getTemplatePath(templateId: string): string {
        if (!templateId || !this.isValidId(templateId)) {
            throw new Error("Invalid template ID");
        }
        return path.join(this.templatesDir, `${templateId}.json`);
    }

    /**
     * Get path for categories file
     */
    getCategoriesPath(): string {
        return path.join(this.dataDir, "categories.json");
    }

    /**
     * Ensure directory exists
     */
    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            throw this.createFileSystemError(error, `create directory: ${dirPath}`);
        }
    }

    /**
     * Validate ID contains only safe characters
     */
    private isValidId(id: string): boolean {
        return /^[a-zA-Z0-9_-]+$/i.test(id);
    }

    /**
     * Create descriptive error messages for file system operations
     */
    private createFileSystemError(error: unknown, operation: string): Error {
        const nodeError = error as NodeJS.ErrnoException;
        const filePath = nodeError.path || "unknown path";

        switch (nodeError.code) {
            case "ENOENT":
                return new Error(`File or directory not found during ${operation}`);

            case "EACCES":
            case "EPERM":
                return new Error(`Permission denied during ${operation}. Check Docker volume permissions.`);

            case "EBUSY":
                return new Error(`File is busy or locked during ${operation}. Please try again.`);

            case "EISDIR":
                return new Error(`Expected file but found directory: ${filePath}`);

            case "ENOTDIR":
                return new Error(`Expected directory but found file: ${filePath}`);

            case "EMFILE":
            case "ENFILE":
                return new Error(`System resource limit reached during ${operation}`);

            default:
                return new Error(`File system error during ${operation}: ${nodeError.message || "Unknown error"}`);
        }
    }
}
