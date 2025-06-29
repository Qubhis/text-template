/**
 * Core data models for the template system
 */

// Template interface
export interface Template {
    id: string;
    title: string;
    content: string;
    category?: string;
    description?: string;
    tags: string[];
    created: string; // ISO date string
    modified: string; // ISO date string
}

// Template creation input (omits auto-generated fields)
export interface CreateTemplateInput {
    title: string;
    content: string;
    category?: string;
    description?: string;
    tags?: string[];
}

// Template update input (all fields optional except id)
export interface UpdateTemplateInput {
    id: string;
    title?: string;
    content?: string;
    category?: string;
    description?: string;
    tags?: string[];
}

// Category interface
export interface Category {
    id: string;
    name: string;
    color?: string;
}

// Categories file structure
export interface CategoriesData {
    categories: Category[];
}

// Variable types that can be extracted from templates
export interface TemplateVariable {
    name: string;
    type: "text" | "dropdown" | "number" | "boolean" | "date";
    options?: string[]; // For dropdown type
    required: boolean;
}

// Template processing input
export interface ProcessTemplateInput {
    templateId: string;
    variables: Record<string, any>;
}

// Template processing result
export interface ProcessTemplateResult {
    processedContent: string;
    variables: TemplateVariable[];
}

/**
 * Validation utilities for template data
 */
export class TemplateValidator {
    /**
     * Validate template data
     */
    static validateTemplate(data: any): data is Template {
        const errors: string[] = [];

        if (!data || typeof data !== "object") {
            errors.push("Template must be an object");
            return false;
        }

        // Required fields
        if (!data.id || typeof data.id !== "string" || data.id.trim() === "") {
            errors.push("Template ID is required and must be a non-empty string");
        }

        if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
            errors.push("Template title is required and must be a non-empty string");
        }

        if (!data.content || typeof data.content !== "string") {
            errors.push("Template content is required and must be a string");
        }

        if (!data.created || typeof data.created !== "string" || !this.isValidISODate(data.created)) {
            errors.push("Template created date is required and must be a valid ISO date string");
        }

        if (!data.modified || typeof data.modified !== "string" || !this.isValidISODate(data.modified)) {
            errors.push("Template modified date is required and must be a valid ISO date string");
        }

        // Optional fields
        if (data.category !== undefined && (typeof data.category !== "string" || data.category.trim() === "")) {
            errors.push("Template category must be a non-empty string if provided");
        }

        if (data.description !== undefined && typeof data.description !== "string") {
            errors.push("Template description must be a string if provided");
        }

        if (!Array.isArray(data.tags)) {
            errors.push("Template tags must be an array");
        } else {
            const invalidTags = data.tags.filter((tag: any) => typeof tag !== "string" || tag.trim() === "");
            if (invalidTags.length > 0) {
                errors.push("All template tags must be non-empty strings");
            }
        }

        // Validate ID format
        if (data.id && !this.isValidId(data.id)) {
            errors.push("Template ID can only contain letters, numbers, hyphens, and underscores");
        }

        if (errors.length > 0) {
            throw new Error(`Template validation failed: ${errors.join(", ")}`);
        }

        return true;
    }

    /**
     * Validate template creation input
     */
    static validateCreateInput(data: any): data is CreateTemplateInput {
        const errors: string[] = [];

        if (!data || typeof data !== "object") {
            errors.push("Input must be an object");
            return false;
        }

        if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
            errors.push("Title is required and must be a non-empty string");
        }

        if (!data.content || typeof data.content !== "string") {
            errors.push("Content is required and must be a string");
        }

        if (data.category !== undefined && (typeof data.category !== "string" || data.category.trim() === "")) {
            errors.push("Category must be a non-empty string if provided");
        }

        if (data.description !== undefined && typeof data.description !== "string") {
            errors.push("Description must be a string if provided");
        }

        if (data.tags !== undefined) {
            if (!Array.isArray(data.tags)) {
                errors.push("Tags must be an array if provided");
            } else {
                const invalidTags = data.tags.filter((tag: any) => typeof tag !== "string" || tag.trim() === "");
                if (invalidTags.length > 0) {
                    errors.push("All tags must be non-empty strings");
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(`Create template validation failed: ${errors.join(", ")}`);
        }

        return true;
    }

    /**
     * Validate template update input
     */
    static validateUpdateInput(data: any): data is UpdateTemplateInput {
        const errors: string[] = [];

        if (!data || typeof data !== "object") {
            errors.push("Input must be an object");
            return false;
        }

        if (!data.id || typeof data.id !== "string" || data.id.trim() === "") {
            errors.push("ID is required and must be a non-empty string");
        }

        if (data.title !== undefined && (typeof data.title !== "string" || data.title.trim() === "")) {
            errors.push("Title must be a non-empty string if provided");
        }

        if (data.content !== undefined && typeof data.content !== "string") {
            errors.push("Content must be a string if provided");
        }

        if (data.category !== undefined && (typeof data.category !== "string" || data.category.trim() === "")) {
            errors.push("Category must be a non-empty string if provided");
        }

        if (data.description !== undefined && typeof data.description !== "string") {
            errors.push("Description must be a string if provided");
        }

        if (data.tags !== undefined) {
            if (!Array.isArray(data.tags)) {
                errors.push("Tags must be an array if provided");
            } else {
                const invalidTags = data.tags.filter((tag: any) => typeof tag !== "string" || tag.trim() === "");
                if (invalidTags.length > 0) {
                    errors.push("All tags must be non-empty strings");
                }
            }
        }

        if (data.id && !this.isValidId(data.id)) {
            errors.push("Template ID can only contain letters, numbers, hyphens, and underscores");
        }

        if (errors.length > 0) {
            throw new Error(`Update template validation failed: ${errors.join(", ")}`);
        }

        return true;
    }

    /**
     * Validate category data
     */
    static validateCategory(data: any): data is Category {
        const errors: string[] = [];

        if (!data || typeof data !== "object") {
            errors.push("Category must be an object");
            return false;
        }

        if (!data.id || typeof data.id !== "string" || data.id.trim() === "") {
            errors.push("Category ID is required and must be a non-empty string");
        }

        if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
            errors.push("Category name is required and must be a non-empty string");
        }

        if (data.color !== undefined && (typeof data.color !== "string" || !this.isValidColor(data.color))) {
            errors.push("Category color must be a valid hex color if provided");
        }

        if (data.id && !this.isValidId(data.id)) {
            errors.push("Category ID can only contain letters, numbers, hyphens, and underscores");
        }

        if (errors.length > 0) {
            throw new Error(`Category validation failed: ${errors.join(", ")}`);
        }

        return true;
    }

    /**
     * Check if string is a valid ID (alphanumeric, hyphens, underscores)
     */
    private static isValidId(id: string): boolean {
        return /^[a-zA-Z0-9_-]+$/.test(id);
    }

    /**
     * Check if string is a valid ISO date
     */
    private static isValidISODate(dateString: string): boolean {
        const date = new Date(dateString);
        return date.toISOString() === dateString;
    }

    /**
     * Check if string is a valid hex color
     */
    private static isValidColor(color: string): boolean {
        return /^#[0-9a-fA-F]{6}$/.test(color);
    }
}

/**
 * Utility functions for template operations
 */
export class TemplateUtils {
    /**
     * Generate a unique ID for a template based on title
     */
    static generateId(title: string): string {
        const timestamp = Date.now().toString(36);
        const sanitized = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-") // Remove duplicate hyphens
            .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
            .substring(0, 30); // Limit length

        return sanitized ? `${sanitized}-${timestamp}` : `template-${timestamp}`;
    }

    /**
     * Create a new template from input data
     */
    static createTemplate(input: CreateTemplateInput): Template {
        const now = new Date().toISOString();

        return {
            id: this.generateId(input.title),
            title: input.title.trim(),
            content: input.content,
            category: input.category?.trim() || undefined,
            description: input.description?.trim() || undefined,
            tags: input.tags || [],
            created: now,
            modified: now,
        };
    }

    /**
     * Update an existing template with new data
     */
    static updateTemplate(existing: Template, updates: Omit<UpdateTemplateInput, "id">): Template {
        const updated: Template = {
            ...existing,
            modified: new Date().toISOString(),
        };

        if (updates.title !== undefined) {
            updated.title = updates.title.trim();
        }
        if (updates.content !== undefined) {
            updated.content = updates.content;
        }
        if (updates.category !== undefined) {
            updated.category = updates.category.trim() || undefined;
        }
        if (updates.description !== undefined) {
            updated.description = updates.description.trim() || undefined;
        }
        if (updates.tags !== undefined) {
            updated.tags = updates.tags;
        }

        return updated;
    }

    /**
     * Create a category with generated ID
     */
    static createCategory(name: string, color?: string): Category {
        return {
            id: this.generateId(name),
            name: name.trim(),
            color: color || "#3b82f6",
        };
    }
}
