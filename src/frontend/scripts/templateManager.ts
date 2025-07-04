// src/frontend/scripts/templateManager.ts

// Template Data Manager & State Management
// Handles template data, caching, state management, and UI integration

import { ApiClient, Template, CreateTemplateInput, UpdateTemplateInput, Category, ApiUtils, isTemplate } from "./apiClient.js";

// Application state interfaces
export interface AppState {
    templates: Template[];
    categories: Category[];
    currentTemplate: Template | null;
    selectedTemplateId: string | null;
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
    filteredTemplates: Template[];
}

export interface SearchChangedEventParameters {
    query: string;
    results: Template[];
}

export function isSearchChangedEventParameters(value: unknown): value is SearchChangedEventParameters {
    return (
        typeof value === "object" &&
        value !== null &&
        "query" in value &&
        "results" in value &&
        Array.isArray(value.results) &&
        value.results.every((result) => isTemplate(result))
    );
}

// Event types for state change notifications
export type StateChangeEvent =
    | "templates-loaded"
    | "template-selected"
    | "template-created"
    | "template-updated"
    | "template-deleted"
    | "loading-start"
    | "loading-end"
    | "error-occurred"
    | "error-cleared"
    | "search-changed";

// Event listener callback type
export type StateChangeListener = (event: StateChangeEvent, data?: unknown) => void;

/**
 * Template Data Manager
 * Central state management for template data with caching and event system
 */
export default class TemplateManager {
    private state: AppState;
    private listeners: Map<StateChangeEvent, Set<StateChangeListener>>;

    constructor() {
        this.state = this.createInitialState();
        this.listeners = new Map();
        this.initializeEventTypes();
    }

    /**
     * Initialize the manager and load initial data
     */
    async initialize(): Promise<void> {
        try {
            this.setLoading(true);
            this.clearError();

            // Load templates and categories in parallel
            const [templates, categories] = await Promise.all([this.loadTemplates(), this.loadCategories()]);

            this.updateState({
                templates,
                categories,
                filteredTemplates: templates,
            });

            this.emit("templates-loaded", templates);
        } catch (error) {
            this.handleError("Failed to initialize template manager", error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Get current application state (read-only)
     */
    getState(): Readonly<AppState> {
        return { ...this.state };
    }

    /**
     * Get categories
     */
    getCategories(): Category[] {
        return [...this.state.categories];
    }

    /**
     * Get template by ID from current state
     */
    getTemplate(id: string): Template | null {
        if (!id) return null;

        const template = this.state.templates.find((t) => t.id === id);
        return template ? { ...template } : null;
    }

    /**
     * Select a template by ID
     */
    selectTemplate(id: string | null): void {
        if (id === null) {
            this.updateState({
                selectedTemplateId: null,
                currentTemplate: null,
            });
            return;
        }

        const template = this.getTemplate(id);
        if (template) {
            this.updateState({
                selectedTemplateId: id,
                currentTemplate: template,
            });
            this.emit("template-selected", template);
        } else {
            this.handleError(`Template "${id}" not found`, new Error("Template not found"));
        }
    }

    /**
     * Create new template
     */
    async createTemplate(templateData: CreateTemplateInput): Promise<Template | null> {
        try {
            this.setLoading(true);
            this.clearError();

            const newTemplate = await ApiClient.createTemplate(templateData);

            // Add to state
            const updatedTemplates = [newTemplate, ...this.state.templates];
            this.updateState({
                templates: updatedTemplates,
                filteredTemplates: this.filterTemplates(updatedTemplates, this.state.searchQuery),
                currentTemplate: newTemplate,
                selectedTemplateId: newTemplate.id,
            });

            this.emit("template-created", newTemplate);
            return { ...newTemplate };
        } catch (error) {
            this.handleError("Failed to create template", error);
            return null;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Update existing template
     */
    async updateTemplate(id: string, updates: UpdateTemplateInput): Promise<Template | null> {
        try {
            this.setLoading(true);
            this.clearError();

            const updatedTemplate = await ApiClient.updateTemplate(id, updates);

            // Update state
            const updatedTemplates = this.state.templates.map((t) => (t.id === id ? updatedTemplate : t));

            this.updateState({
                templates: updatedTemplates,
                filteredTemplates: this.filterTemplates(updatedTemplates, this.state.searchQuery),
                currentTemplate: this.state.selectedTemplateId === id ? updatedTemplate : this.state.currentTemplate,
            });

            this.emit("template-updated", updatedTemplate);
            return { ...updatedTemplate };
        } catch (error) {
            this.handleError(`Failed to update template "${id}"`, error);
            return null;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Delete template
     */
    async deleteTemplate(id: string): Promise<boolean> {
        try {
            this.setLoading(true);
            this.clearError();

            await ApiClient.deleteTemplate(id);

            // Remove from state
            const updatedTemplates = this.state.templates.filter((t) => t.id !== id);
            const newState: Partial<AppState> = {
                templates: updatedTemplates,
                filteredTemplates: this.filterTemplates(updatedTemplates, this.state.searchQuery),
            };

            // Clear current template if it was deleted
            if (this.state.selectedTemplateId === id) {
                newState.selectedTemplateId = null;
                newState.currentTemplate = null;
            }

            this.updateState(newState);

            this.emit("template-deleted", { id });
            return true;
        } catch (error) {
            this.handleError(`Failed to delete template "${id}"`, error);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Search templates
     */
    searchTemplates(query: string): void {
        const normalizedQuery = query.toLowerCase().trim();
        const filtered = this.filterTemplates(this.state.templates, normalizedQuery);

        this.updateState({
            searchQuery: normalizedQuery,
            filteredTemplates: filtered,
        });

        this.emit("search-changed", { query: normalizedQuery, results: filtered } as SearchChangedEventParameters);
    }

    /**
     * Refresh templates from server
     */
    async refreshTemplates(): Promise<void> {
        try {
            this.setLoading(true);
            this.clearError();

            const templates = await this.loadTemplates();
            this.updateState({
                templates,
                filteredTemplates: this.filterTemplates(templates, this.state.searchQuery),
            });

            // Clear cache to force fresh data on next access
            this.state.templates.forEach((template) => {
                // Update any templates that might have changed
                const freshTemplate = templates.find((t) => t.id === template.id);
                if (freshTemplate && freshTemplate.modified !== template.modified) {
                    // Template was modified externally (shouldn't happen in single-user app)
                    console.info(`Template "${template.id}" was updated externally`);
                }
            });

            this.emit("templates-loaded", templates);
        } catch (error) {
            this.handleError("Failed to refresh templates", error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Add event listener
     */
    addEventListener(event: StateChangeEvent, listener: StateChangeListener): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    // Private methods

    private createInitialState(): AppState {
        return {
            templates: [],
            categories: [],
            currentTemplate: null,
            selectedTemplateId: null,
            isLoading: false,
            error: null,
            searchQuery: "",
            filteredTemplates: [],
        };
    }

    private initializeEventTypes(): void {
        const events: StateChangeEvent[] = [
            "templates-loaded",
            "template-selected",
            "template-created",
            "template-updated",
            "template-deleted",
            "loading-start",
            "loading-end",
            "error-occurred",
            "error-cleared",
            "search-changed",
        ];

        events.forEach((event) => {
            this.listeners.set(event, new Set());
        });
    }

    private async loadTemplates(): Promise<Template[]> {
        const templates = await ApiClient.getTemplates();
        // Sort by modification date (newest first)
        return templates.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    }

    private async loadCategories(): Promise<Category[]> {
        return await ApiClient.getCategories();
    }

    private updateState(updates: Partial<AppState>): void {
        this.state = { ...this.state, ...updates };
    }

    private setLoading(loading: boolean): void {
        if (this.state.isLoading !== loading) {
            this.updateState({ isLoading: loading });
            this.emit(loading ? "loading-start" : "loading-end");
        }
    }

    private handleError(message: string, error: unknown): void {
        console.error(message, error);

        // Use ApiUtils for better error classification and messaging
        const userMessage = error instanceof Error ? ApiUtils.getErrorMessage(error) : message;
        const errorData = {
            message: userMessage,
            originalError: error,
            timestamp: new Date(),
            context: message,
        };

        this.updateState({ error: userMessage });
        this.emit("error-occurred", errorData);
    }

    private clearError(): void {
        if (this.state.error) {
            this.updateState({ error: null });
            this.emit("error-cleared");
        }
    }

    private emit(event: StateChangeEvent, data?: unknown): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((listener) => {
                try {
                    listener(event, data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    private filterTemplates(templates: Template[], query: string): Template[] {
        if (!query) return templates;

        return templates.filter(
            (template) =>
                template.title.toLowerCase().includes(query) ||
                template.content.toLowerCase().includes(query) ||
                (template.description && template.description.toLowerCase().includes(query)) ||
                (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(query)))
        );
    }
}

// Singleton instance with lazy initialization
let templateManagerInstance: TemplateManager | null = null;
