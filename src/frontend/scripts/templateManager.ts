// Template Data Manager & State Management
// Handles template data, caching, state management, and UI integration

import { ApiClient, Template, CreateTemplateInput, UpdateTemplateInput, Category } from "./apiClient.js";

// Application state interfaces
export interface AppState {
    templates: Template[];
    categories: Category[];
    currentTemplate: Template | null;
    selectedTemplateId: string | null;
    isLoading: boolean;
    error: string | null;
    lastSync: Date | null;
    isDirty: boolean; // Has unsaved changes
    searchQuery: string;
    filteredTemplates: Template[];
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

// Cache configuration
interface CacheConfig {
    maxAge: number; // milliseconds
    maxSize: number; // number of templates
}

const CACHE_CONFIG: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // max 100 templates in cache
};

/**
 * Template Data Manager
 * Central state management for template data with caching and event system
 */
export class TemplateManager {
    private state: AppState;
    private listeners: Map<StateChangeEvent, Set<StateChangeListener>>;
    private cache: Map<string, { template: Template; timestamp: number }>;

    constructor() {
        this.state = this.createInitialState();
        this.listeners = new Map();
        this.cache = new Map();
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
                lastSync: new Date(),
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
     * Get all templates
     */
    getTemplates(): Template[] {
        return [...this.state.templates];
    }

    /**
     * Get filtered templates based on current search
     */
    getFilteredTemplates(): Template[] {
        return [...this.state.filteredTemplates];
    }

    /**
     * Get current template
     */
    getCurrentTemplate(): Template | null {
        return this.state.currentTemplate ? { ...this.state.currentTemplate } : null;
    }

    /**
     * Get categories
     */
    getCategories(): Category[] {
        return [...this.state.categories];
    }

    /**
     * Get template by ID (with caching)
     */
    async getTemplate(id: string): Promise<Template | null> {
        if (!id) return null;

        try {
            // Check cache first
            const cached = this.cache.get(id);
            if (cached && this.isCacheValid(cached.timestamp)) {
                return { ...cached.template };
            }

            this.setLoading(true);
            const template = await ApiClient.getTemplate(id);

            // Update cache
            this.cache.set(id, { template, timestamp: Date.now() });
            this.cleanupCache();

            // Update state if this is the current template
            if (this.state.selectedTemplateId === id) {
                this.updateState({ currentTemplate: template });
            }

            return { ...template };
        } catch (error) {
            this.handleError(`Failed to load template "${id}"`, error);
            return null;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Select a template by ID
     */
    async selectTemplate(id: string | null): Promise<void> {
        try {
            if (id === null) {
                this.updateState({
                    selectedTemplateId: null,
                    currentTemplate: null,
                    isDirty: false,
                });
                this.emit("template-selected", null);
                return;
            }

            this.setLoading(true);
            const template = await this.getTemplate(id);

            if (template) {
                this.updateState({
                    selectedTemplateId: id,
                    currentTemplate: template,
                    isDirty: false,
                });
                this.emit("template-selected", template);
            }
        } catch (error) {
            this.handleError(`Failed to select template "${id}"`, error);
        } finally {
            this.setLoading(false);
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
                isDirty: false,
                lastSync: new Date(),
            });

            // Update cache
            this.cache.set(newTemplate.id, { template: newTemplate, timestamp: Date.now() });

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
                isDirty: false,
                lastSync: new Date(),
            });

            // Update cache
            this.cache.set(id, { template: updatedTemplate, timestamp: Date.now() });

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
                lastSync: new Date(),
            };

            // Clear current template if it was deleted
            if (this.state.selectedTemplateId === id) {
                newState.selectedTemplateId = null;
                newState.currentTemplate = null;
                newState.isDirty = false;
            }

            this.updateState(newState);

            // Remove from cache
            this.cache.delete(id);

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

        this.emit("search-changed", { query: normalizedQuery, results: filtered });
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
                lastSync: new Date(),
            });

            // Clear cache to force fresh data
            this.cache.clear();

            this.emit("templates-loaded", templates);
        } catch (error) {
            this.handleError("Failed to refresh templates", error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Mark current template as dirty (has unsaved changes)
     */
    markDirty(): void {
        if (!this.state.isDirty) {
            this.updateState({ isDirty: true });
        }
    }

    /**
     * Clear dirty flag
     */
    clearDirty(): void {
        if (this.state.isDirty) {
            this.updateState({ isDirty: false });
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

    /**
     * Remove event listener
     */
    removeEventListener(event: StateChangeEvent, listener: StateChangeListener): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(listener);
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.listeners.clear();
        this.cache.clear();
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
            lastSync: null,
            isDirty: false,
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

        let errorMessage = message;
        if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
        }

        this.updateState({ error: errorMessage });
        this.emit("error-occurred", { message: errorMessage, originalError: error });
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

    private isCacheValid(timestamp: number): boolean {
        return Date.now() - timestamp < CACHE_CONFIG.maxAge;
    }

    private cleanupCache(): void {
        if (this.cache.size <= CACHE_CONFIG.maxSize) return;

        // Remove oldest entries
        const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = entries.slice(0, entries.length - CACHE_CONFIG.maxSize);
        toRemove.forEach(([id]) => this.cache.delete(id));
    }
}

// Singleton instance with lazy initialization
let templateManagerInstance: TemplateManager | null = null;

/**
 * Get the singleton TemplateManager instance
 * Automatically initializes on first call
 */
export async function getTemplateManager(): Promise<TemplateManager> {
    if (!templateManagerInstance) {
        templateManagerInstance = new TemplateManager();
        await templateManagerInstance.initialize();
    }
    return templateManagerInstance;
}

export default TemplateManager;
