// src/frontend/scripts/ui/templateList.ts

// Template List UI Component
// Handles sidebar template list display, selection, and search functionality

import { isTemplate, Template } from "../core/apiClient.js";
import DataManager, { StateChangeEvent, StateChangeListener, isSearchChangedEventParameters } from "../core/dataManager.js";
import { getRequiredElement, clearChildren, addEventListenerWithCleanup, addClass, removeClass } from "../utils/domHelpers.js";
import { escapeHtml, formatDate } from "../utils/formatters.js";

export interface TemplateListCallbacks {
    onTemplateSelect?: (templateId: string) => void;
    onCreateTemplate?: () => void;
}

/**
 * Template List Component
 * Manages the sidebar template list UI and interactions
 */
export class TemplateList {
    private dataManager: DataManager;
    private callbacks: TemplateListCallbacks;
    private cleanupFunctions: (() => void)[] = [];

    // DOM Elements
    private templateListElement: HTMLElement;
    private searchInput: HTMLInputElement;
    private createButton: HTMLButtonElement;

    // State
    private isInteractive = true;
    private selectedTemplateId: string | null = null;

    constructor(dataManager: DataManager, callbacks: TemplateListCallbacks = {}) {
        this.dataManager = dataManager;
        this.callbacks = callbacks;

        // Get required DOM elements
        this.templateListElement = getRequiredElement<HTMLElement>("templateList");
        this.searchInput = getRequiredElement<HTMLInputElement>("templateSearch");
        this.createButton = getRequiredElement<HTMLButtonElement>("createTemplateBtn");
    }

    /**
     * Initialize the template list component
     */
    public initialize(): void {
        this.setupEventListeners();
        this.setupDataManagerListeners();
        this.loadInitialData();
    }

    /**
     * Set up DOM event listeners
     */
    private setupEventListeners(): void {
        // Search input
        const searchCleanup = addEventListenerWithCleanup(this.searchInput, "input", (e) => {
            const query = (e.target as HTMLInputElement).value;
            this.handleSearch(query);
        });
        this.cleanupFunctions.push(searchCleanup);

        // Create template button
        const createCleanup = addEventListenerWithCleanup(this.createButton, "click", () => this.handleCreateTemplate());
        this.cleanupFunctions.push(createCleanup);
    }

    /**
     * Set up data manager event listeners
     */
    private setupDataManagerListeners(): void {
        // Templates loaded
        const templatesLoadedListener: StateChangeListener = (event, data) => {
            const templates: unknown[] = !Array.isArray(data) ? [data] : data;
            const nonTemplates = templates.filter((template) => !isTemplate(template));
            if (nonTemplates.length > 0) {
                console.debug("Invalid template data received from template manager:", templates);
                throw new Error("Invalid template data received from template manager");
            }
            this.updateTemplateList(templates as Template[]);
        };
        this.dataManager.addEventListener("templates-loaded", templatesLoadedListener);

        // Search results
        const searchChangedListener: StateChangeListener = (event, data) => {
            if (!isSearchChangedEventParameters(data)) {
                console.debug("Invalid search data received from template manager:", data);
                throw new Error("Invalid search data received from template manager");
            }
            this.updateTemplateList(data.results);
        };
        this.dataManager.addEventListener("search-changed", searchChangedListener);

        // Template selection from external sources
        const templateSelectedListener: StateChangeListener = (event, data) => {
            if (data && typeof data === "object" && "id" in data) {
                const template = data as Template;
                this.setSelectedTemplate(template.id);
            }
        };
        this.dataManager.addEventListener("template-selected", templateSelectedListener);

        // Template list changes - refresh list but preserve selection
        const listChangeEvents: StateChangeEvent[] = ["template-created", "template-updated", "template-deleted"];
        listChangeEvents.forEach((eventName) => {
            const listener: StateChangeListener = (event, data) => {
                this.refreshTemplateList();

                const template: Template | undefined = isTemplate(data) ? data : undefined;
                this.setSelectedTemplate(template?.id ?? null);
            };
            this.dataManager.addEventListener(eventName, listener);
        });
    }

    /**
     * Load initial template data
     */
    private loadInitialData(): void {
        console.log("📋 Loading initial template list...");
        this.refreshTemplateList();
        this.setSelectedTemplate(null);
    }

    /**
     * Handle search input
     */
    private handleSearch(query: string): void {
        if (!this.isInteractive) return;
        this.dataManager.searchTemplates(query);
    }

    /**
     * Handle create template button click
     */
    private handleCreateTemplate(): void {
        if (!this.isInteractive) return;

        if (this.callbacks.onCreateTemplate) {
            this.setSelectedTemplate(null);
            this.callbacks.onCreateTemplate();
        } else {
            console.warn("No create template callback provided");
        }
    }

    /**
     * Handle template item click
     */
    private handleTemplateClick(templateId: string): void {
        if (!this.isInteractive) return;

        this.setSelectedTemplate(templateId);

        if (this.callbacks.onTemplateSelect) {
            this.callbacks.onTemplateSelect(templateId);
        } else {
            console.warn("No template select callback provided");
        }
    }

    /**
     * Update template list display
     */
    private updateTemplateList(templates: Template[]): void {
        clearChildren(this.templateListElement);

        if (templates.length === 0) {
            this.showEmptyState();
            return;
        }

        // Create template items
        templates.forEach((template) => {
            const templateItem = this.createTemplateItem(template);
            this.templateListElement.appendChild(templateItem);
        });
    }

    /**
     * Show empty state message
     */
    private showEmptyState(): void {
        const emptyState = document.createElement("div");
        emptyState.className = "loading";

        const searchQuery = this.searchInput.value.trim();
        if (searchQuery) {
            emptyState.innerHTML = `
                <p>No templates found for "${escapeHtml(searchQuery)}"</p>
                <p class="text-muted">Try adjusting your search terms.</p>
            `;
        } else {
            emptyState.innerHTML = `
                <p>No templates found.</p>
                <p class="text-muted">Create your first template to get started!</p>
            `;
        }

        this.templateListElement.appendChild(emptyState);
    }

    /**
     * Create template item element
     */
    private createTemplateItem(template: Template): HTMLElement {
        const templateItem = document.createElement("div");
        templateItem.className = "template-item";
        templateItem.setAttribute("data-template-id", template.id);

        // Check if this template is selected
        if (template.id === this.selectedTemplateId) {
            addClass(templateItem, "active");
        }

        templateItem.innerHTML = `
            <div class="template-item-title">${escapeHtml(template.title)}</div>
            <div class="template-item-meta">
                <span class="category-tag">${escapeHtml(this.dataManager.getCategoryNameById(template.categoryId))}</span>
                <span class="template-date">${formatDate(template.modified)}</span>
            </div>
        `;

        // Add click listener
        const clickCleanup = addEventListenerWithCleanup(templateItem, "click", () => this.handleTemplateClick(template.id));
        this.cleanupFunctions.push(clickCleanup);

        return templateItem;
    }

    /**
     * Set selected template and update UI
     */
    private setSelectedTemplate(templateId: string | null): void {
        this.selectedTemplateId = templateId;
        this.updateSelectedTemplateInUI();
    }

    /**
     * Update selected template visual state in UI
     */
    private updateSelectedTemplateInUI(): void {
        // Remove active class from all items
        const allItems = this.templateListElement.querySelectorAll(".template-item");
        allItems.forEach((item) => removeClass(item as HTMLElement, "active"));

        // Add active class to selected item
        if (this.selectedTemplateId) {
            const selectedItem = this.templateListElement.querySelector(`[data-template-id="${this.selectedTemplateId}"]`) as HTMLElement;

            if (selectedItem) {
                addClass(selectedItem, "active");
            }
        }
    }

    /**
     * Refresh template list from data manager
     */
    private refreshTemplateList(): void {
        const state = this.dataManager.getState();
        this.updateTemplateList(state.filteredTemplates);
    }

    /**
     * Set interactive state
     * When false, disables user interactions (useful during editing)
     */
    public setInteractive(interactive: boolean): void {
        this.isInteractive = interactive;

        // Update UI state
        this.searchInput.disabled = !interactive;
        this.createButton.disabled = !interactive;

        // Update visual styling
        const templateItems = this.templateListElement.querySelectorAll(".template-item");
        templateItems.forEach((item) => {
            const element = item as HTMLElement;
            if (interactive) {
                element.style.pointerEvents = "";
                removeClass(element, "disabled");
            } else {
                element.style.pointerEvents = "none";
                addClass(element, "disabled");
            }
        });
    }

    /**
     * Get current search query
     */
    public getSearchQuery(): string {
        return this.searchInput.value.trim();
    }

    /**
     * Set search query programmatically
     */
    public setSearchQuery(query: string): void {
        this.searchInput.value = query;
        this.handleSearch(query);
    }

    /**
     * Clear search
     */
    public clearSearch(): void {
        this.setSearchQuery("");
    }

    /**
     * Focus search input
     */
    public focusSearch(): void {
        this.searchInput.focus();
    }

    /**
     * Get selected template ID
     */
    public getSelectedTemplateId(): string | null {
        return this.selectedTemplateId;
    }

    /**
     * Scroll selected template into view
     */
    public scrollToSelected(): void {
        if (this.selectedTemplateId) {
            const selectedItem = this.templateListElement.querySelector(`[data-template-id="${this.selectedTemplateId}"]`) as HTMLElement;

            if (selectedItem) {
                selectedItem.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                });
            }
        }
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];

        // Clear DOM
        clearChildren(this.templateListElement);
    }
}
