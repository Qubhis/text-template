// src/frontend/scripts/ui/templateHeader.ts

// Template Header Component
// Handles template title, category, modified date display and action buttons

import { Template } from "../core/apiClient.js";
import { getRequiredElement, setTextContent, setElementVisibility, addEventListenerWithCleanup } from "../utils/domHelpers.js";
import { formatDate } from "../utils/formatters.js";

export interface TemplateHeaderCallbacks {
    onEditTemplate?: () => void;
    onDeleteTemplate?: () => void;
}

/**
 * Template Header Component
 * Manages template information display and action buttons in the header
 */
export class TemplateHeader {
    private callbacks: TemplateHeaderCallbacks;
    private cleanupFunctions: (() => void)[] = [];

    // DOM Elements
    private titleElement: HTMLElement;
    private categoryElement: HTMLElement;
    private modifiedElement: HTMLElement;
    private editButton: HTMLButtonElement;
    private deleteButton: HTMLButtonElement;

    constructor(callbacks: TemplateHeaderCallbacks = {}) {
        this.callbacks = callbacks;

        // Get required DOM elements
        this.titleElement = getRequiredElement<HTMLElement>("templateTitle");
        this.categoryElement = getRequiredElement<HTMLElement>("templateCategory");
        this.modifiedElement = getRequiredElement<HTMLElement>("templateModified");
        this.editButton = getRequiredElement<HTMLButtonElement>("editTemplateBtn");
        this.deleteButton = getRequiredElement<HTMLButtonElement>("deleteTemplateBtn");
    }

    /**
     * Initialize the template header component
     */
    public initialize(): void {
        this.setupEventListeners();
        this.updateHeader(); // Start with no template selected
    }

    /**
     * Set up action button event listeners
     */
    private setupEventListeners(): void {
        // Edit button
        const editCleanup = addEventListenerWithCleanup(this.editButton, "click", () => {
            if (this.callbacks.onEditTemplate) {
                this.callbacks.onEditTemplate();
            }
        });
        this.cleanupFunctions.push(editCleanup);

        // Delete button
        const deleteCleanup = addEventListenerWithCleanup(this.deleteButton, "click", () => {
            if (this.callbacks.onDeleteTemplate) {
                this.callbacks.onDeleteTemplate();
            }
        });
        this.cleanupFunctions.push(deleteCleanup);
    }

    /**
     * Update header with template information
     */
    public updateHeader(template?: Template): void {
        if (template) {
            this.showTemplateInfo(template);
            this.enableActionButtons(true);
        } else {
            this.showEmptyState();
            this.enableActionButtons(false);
        }
    }

    /**
     * Show template information in header
     */
    private showTemplateInfo(template: Template): void {
        setTextContent(this.titleElement, template.title);
        setTextContent(this.categoryElement, template.category || "Uncategorized");
        setTextContent(this.modifiedElement, `Modified ${formatDate(template.modified)}`);

        // Show category and modified info
        setElementVisibility(this.categoryElement, true);
        setElementVisibility(this.modifiedElement, true);
    }

    /**
     * Show empty state when no template selected
     */
    private showEmptyState(): void {
        setTextContent(this.titleElement, "Select a template");

        // Hide category and modified info
        setElementVisibility(this.categoryElement, false);
        setElementVisibility(this.modifiedElement, false);
    }

    /**
     * Enable or disable action buttons
     */
    private enableActionButtons(enabled: boolean): void {
        this.editButton.disabled = !enabled;
        this.deleteButton.disabled = !enabled;
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];
    }
}
