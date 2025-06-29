import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

/**
 * Simple utility for JSON file operations
 * Handles reading and writing template data files
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
        await this.ensureDirectoryExists(this.dataDir);
        await this.ensureDirectoryExists(this.templatesDir);

        // Initialize categories.json if it doesn't exist
        const categoriesPath = this.getCategoriesPath();
        if (!existsSync(categoriesPath)) {
            await this.writeJsonFile(categoriesPath, { categories: [] });
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
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to read file: ${filePath}`);
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
            throw new Error(`Failed to write file: ${filePath}`);
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return; // File doesn't exist, that's fine
            }
            throw new Error(`Failed to delete file: ${filePath}`);
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
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
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return [];
            }
            throw new Error("Failed to list template files");
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
            throw new Error(`Failed to create directory: ${dirPath}`);
        }
    }

    /**
     * Validate ID contains only safe characters
     */
    private isValidId(id: string): boolean {
        return /^[a-zA-Z0-9_-]+$/i.test(id);
    }
}
