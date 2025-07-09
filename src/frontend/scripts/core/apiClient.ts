// frontend/scripts/core/apiClient.ts

// Frontend API Client Service
// Handles all communication with the backend REST API

// Types matching backend models
export interface Template {
    id: string;
    title: string;
    content: string;
    categoryId: string;
    created: string;
    modified: string;
    description?: string;
    tags?: string[];
}

export interface CreateTemplateInput {
    title: string;
    content: string;
    categoryId?: string;
    description?: string;
    tags?: string[];
}

export interface UpdateTemplateInput {
    title?: string;
    content?: string;
    categoryId?: string;
    description?: string;
    tags?: string[];
}

export interface Category {
    id: string;
    name: string;
    color: string;
    isCustom: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    count?: number;
}

export class ApiError extends Error {
    status?: number;
    code?: string;
    details?: any;
    cause?: Error;

    constructor(message: string, status?: number, code?: string, details?: any, cause?: Error) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
        this.cause = cause;
    }
}

// API Configuration
const API_CONFIG = {
    baseUrl: "/api",
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
};

// HTTP Methods
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// Request options
interface RequestOptions {
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
}

export function isTemplate(value: unknown): value is Template {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        "title" in value &&
        "content" in value &&
        "categoryId" in value &&
        "created" in value &&
        "modified" in value
    );
}

/**
 * Enhanced fetch wrapper with timeout, retries, and error handling
 */
async function fetchWithTimeout(url: string, options: RequestOptions, timeout: number = API_CONFIG.timeout): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Create standardized API error
 */
function createApiError(message: string, originalError: unknown): ApiError {
    const apiError: ApiError = new ApiError(message);

    if (originalError instanceof Error) {
        apiError.cause = originalError;

        // Type-safe property access with proper type checking
        if ("status" in originalError && typeof originalError.status === "number") {
            apiError.status = originalError.status;
        }
        if ("code" in originalError && typeof originalError.code === "string") {
            apiError.code = originalError.code;
        }
        if ("details" in originalError) {
            apiError.details = originalError.details;
        }
    }

    return apiError;
}

/**
 * Make HTTP request with retries and error handling
 */
async function makeRequest<T>(endpoint: string, options: RequestOptions, retries: number = API_CONFIG.retries): Promise<ApiResponse<T>> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options);

            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const apiError = createApiError(errorData?.error || `HTTP ${response.status}: ${response.statusText}`, {
                    status: response.status,
                    code: errorData?.code,
                    details: errorData,
                });

                throw apiError;
            }

            // Parse successful response
            const data: ApiResponse<T> = await response.json();
            return data;
        } catch (error) {
            // Don't retry on client errors (4xx) or final attempt
            if (attempt === retries || ((error as ApiError).status && (error as ApiError).status! >= 400 && (error as ApiError).status! < 500)) {
                throw error;
            }

            // Wait before retry
            if (attempt < retries) {
                await new Promise((resolve) => setTimeout(resolve, API_CONFIG.retryDelay * Math.pow(2, attempt)));
            }
        }
    }

    throw new Error("Maximum retries exceeded");
}

/**
 * API Client Class
 * Provides methods for all backend operations
 */
export class ApiClient {
    /**
     * Get all templates
     */
    static async getTemplates(): Promise<Template[]> {
        try {
            const response = await makeRequest<Template[]>("/templates", {
                method: "GET",
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to fetch templates");
            }

            return response.data;
        } catch (error) {
            console.error("Error fetching templates:", error);
            throw createApiError("Failed to load templates", error);
        }
    }

    /**
     * Create new template
     */
    static async createTemplate(templateData: CreateTemplateInput): Promise<Template> {
        // Validate required fields
        if (!templateData.title || !templateData.content) {
            throw new Error("Title and content are required");
        }

        try {
            const response = await makeRequest<Template>("/templates", {
                method: "POST",
                body: JSON.stringify(templateData),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to create template");
            }

            return response.data;
        } catch (error) {
            console.error("Error creating template:", error);
            throw createApiError("Failed to create template", error);
        }
    }

    /**
     * Update existing template
     */
    static async updateTemplate(id: string, templateData: UpdateTemplateInput): Promise<Template> {
        if (!id || typeof id !== "string") {
            throw new Error("Template ID is required");
        }

        try {
            const response = await makeRequest<Template>(`/templates/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify(templateData),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to update template");
            }

            return response.data;
        } catch (error) {
            console.error(`Error updating template ${id}:`, error);
            throw createApiError(`Failed to update template "${id}"`, error);
        }
    }

    /**
     * Delete template
     */
    static async deleteTemplate(id: string): Promise<void> {
        if (!id || typeof id !== "string") {
            throw new Error("Template ID is required");
        }

        try {
            const response = await makeRequest<void>(`/templates/${encodeURIComponent(id)}`, {
                method: "DELETE",
            });

            if (!response.success) {
                throw new Error(response.error || "Failed to delete template");
            }
        } catch (error) {
            console.error(`Error deleting template ${id}:`, error);
            throw createApiError(`Failed to delete template "${id}"`, error);
        }
    }

    /**
     * Get all categories (when implemented)
     */
    static async getCategories(): Promise<Category[]> {
        try {
            const response = await makeRequest<Category[]>("/categories", {
                method: "GET",
            });

            if (!response.success || !response.data) {
                // Return empty array if categories endpoint not implemented yet
                return [];
            }

            return response.data;
        } catch (error) {
            console.warn("Categories endpoint not available:", error);
            throw createApiError("Failed to get categories", error);
        }
    }
}

/**
 * Utility functions for API operations
 */
export class ApiUtils {
    /**
     * Check if error is network-related
     */
    static isNetworkError(error: any): boolean {
        return error instanceof TypeError && error.message.includes("fetch");
    }

    /**
     * Check if error is timeout-related
     */
    static isTimeoutError(error: any): boolean {
        return error.name === "AbortError" || error.message.includes("timeout");
    }

    /**
     * Check if error is server-related (5xx)
     */
    static isServerError(error: any): boolean {
        return error.status && error.status >= 500;
    }

    /**
     * Check if error is client-related (4xx)
     */
    static isClientError(error: any): boolean {
        return error.status && error.status >= 400 && error.status < 500;
    }

    /**
     * Get user-friendly error message
     */
    static getErrorMessage(error: any): string {
        if (this.isNetworkError(error)) {
            return "Network connection failed. Please check your internet connection.";
        }

        if (this.isTimeoutError(error)) {
            return "Request timed out. Please try again.";
        }

        if (this.isServerError(error)) {
            return "Server error occurred. Please try again later.";
        }

        if (error.status === 404) {
            return "The requested resource was not found.";
        }

        if (error.status === 400) {
            return error.message || "Invalid request. Please check your input.";
        }

        return error.message || "An unexpected error occurred.";
    }
}

export default ApiClient;
