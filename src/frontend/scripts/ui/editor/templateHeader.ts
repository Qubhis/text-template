// src/frontend/scripts/ui/editor/templateHeader.ts

// Template Header Component - Pure View Component
// Handles display and inline editing, communicates via callbacks

import { Template, Category } from "../../core/apiClient.js";
import {
    getRequiredElement,
    setTextContent,
    setElementTransparent,
    addEventListenerWithCleanup,
    addClass,
    removeClass,
    setElementDisplayed,
} from "../../utils/domHelpers.js";
import { formatDate, escapeHtml } from "../../utils/formatters.js";

export interface TemplateHeaderCallbacks {
    onTitleChange?: (title: string) => void;
    onCategoryChange?: (category: string) => void;
    onSave?: () => void;
    onCancel?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

/**
 * Template data for display
 */
interface TemplateDisplayData {
    title: string;
    categoryId: string;
    description: string;
    content: string;
}

/**
 * Template Header Component - Pure View
 * Displays template info and handles inline editing UI
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

    // Inline editing elements (created dynamically)
    private titleInput: HTMLInputElement | null = null;
    private categorySelect: HTMLSelectElement | null = null;
    private saveButton: HTMLButtonElement | null = null;
    private cancelButton: HTMLButtonElement | null = null;

    // State
    private currentMode: "view" | "edit" | "create" = "view";
    private categories: Category[] = [];

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
        this.showEmptyState();
    }

    /**
     * Set up action button event listeners
     */
    private setupEventListeners(): void {
        // Edit button
        const editCleanup = addEventListenerWithCleanup(this.editButton, "click", () => {
            this.callbacks.onEdit?.();
        });
        this.cleanupFunctions.push(editCleanup);

        // Delete button
        const deleteCleanup = addEventListenerWithCleanup(this.deleteButton, "click", () => {
            this.callbacks.onDelete?.();
        });
        this.cleanupFunctions.push(deleteCleanup);
    }

    /**
     * Set mode and data - main interface for coordinator
     */
    public setMode(mode: "view" | "edit" | "create"): void {
        if (this.currentMode === mode) {
            console.log(`🔄 Mode already set to: ${mode}. Skipping...`);
            return;
        }
        this.currentMode = mode;
        if (mode === "view") {
            this.exitEditMode();
            this.enableActionButtons(true);
        } else if (mode === "edit" || mode === "create") {
            this.enterEditMode();
            this.enableActionButtons(false); // Disable edit/delete buttons in edit mode
        }
    }

    public updateData(data: TemplateDisplayData, modifiedAt?: string): void {
        if (this.currentMode === "view") {
            if (modifiedAt) {
                this.showTemplateInfo(data.title, data.categoryId, modifiedAt);
                this.enableActionButtons(true);
            } else {
                this.showEmptyState();
                this.enableActionButtons(false);
            }
        } else if (this.currentMode === "edit" || this.currentMode === "create") {
            this.updateInlineEditingElements(data);
        }
    }

    /**
     * Set categories for dropdown
     */
    public setCategories(categories: Category[]): void {
        this.categories = categories;
        // Update dropdown if it exists
        this.updateCategoryDropdown();
    }

    /**
     * Focus title input (for create mode)
     */
    public focusTitleInput(): void {
        if (this.titleInput) {
            this.titleInput.focus();
        }
    }

    // Private methods

    /**
     * Show template information in header
     */
    private showTemplateInfo(title: string, categoryId: string, modifiedAt: string): void {
        setTextContent(this.titleElement, title);
        setTextContent(this.categoryElement, this.getCategoryNameById(categoryId));
        setTextContent(this.modifiedElement, `Modified ${formatDate(modifiedAt)}`);

        // Show category and modified info
        setElementTransparent(this.categoryElement, true);
        setElementTransparent(this.modifiedElement, true);
    }

    /**
     * Show empty state when no template selected
     */
    private showEmptyState(): void {
        setTextContent(this.titleElement, "Select a template");
        setTextContent(this.categoryElement, "Uncategorized");

        // Hide category and modified info
        setElementTransparent(this.categoryElement, false);
        setElementTransparent(this.modifiedElement, false);
    }

    /**
     * Enter edit mode with inline editing
     */
    private enterEditMode(): void {
        console.trace("🎨 Entering edit mode...");
        if (!this.titleInput) {
            this.createInlineEditingElements();
            this.switchToEditLayout();
        } else {
            console.log("🎨 Edit mode already active");
        }
    }

    /**
     * Exit edit mode and return to view
     */
    private exitEditMode(): void {
        this.switchToViewLayout();
        this.cleanupInlineEditingElements();
    }

    /**
     * Create inline editing elements
     */
    private createInlineEditingElements(): void {
        // Create title input
        this.titleInput = document.createElement("input");
        this.titleInput.type = "text";
        this.titleInput.className = "inline-edit-title";
        this.titleInput.value = "";
        this.titleInput.maxLength = 200;
        this.titleInput.placeholder = "Enter template title";

        // Create category select
        this.categorySelect = document.createElement("select");
        this.categorySelect.className = "inline-edit-category";
        this.updateCategoryDropdown();
        this.categorySelect.value = "";

        // Create save button
        this.saveButton = document.createElement("button");
        this.saveButton.className = "btn btn-primary";
        this.saveButton.innerHTML = '<span class="icon">💾</span>Save';

        // Create cancel button
        this.cancelButton = document.createElement("button");
        this.cancelButton.className = "btn btn-secondary";
        this.cancelButton.innerHTML = '<span class="icon">✖️</span>Cancel';

        // Add event listeners
        this.setupInlineEditingListeners();
    }

    private updateInlineEditingElements(data: TemplateDisplayData): void {
        if (!this.titleInput || !this.categorySelect) throw new Error("Inline editing elements not created");
        this.titleInput.value = data.title;
        this.categorySelect.value = data.categoryId;
    }

    private getCategoryNameById(categoryId: string): string {
        const category = this.categories.find((c) => c.id === categoryId);
        return category ? category.name : "Uncategorized";
    }

    /**
     * Update category dropdown options
     */
    private updateCategoryDropdown(): void {
        if (!this.categorySelect) return;

        // Clear existing options
        this.categorySelect.innerHTML = "";

        // Add default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select category...";
        this.categorySelect.appendChild(defaultOption);

        // Add category options
        this.categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            this.categorySelect!.appendChild(option);
        });
    }

    /**
     * Setup event listeners for inline editing elements
     */
    private setupInlineEditingListeners(): void {
        if (!this.titleInput || !this.categorySelect || !this.saveButton || !this.cancelButton) return;

        // Title input changes
        const titleChangeCleanup = addEventListenerWithCleanup(this.titleInput, "input", (e) => {
            this.callbacks.onTitleChange?.((e.target as HTMLInputElement).value);
        });
        this.cleanupFunctions.push(titleChangeCleanup);

        // Category select changes
        const categoryChangeCleanup = addEventListenerWithCleanup(this.categorySelect, "change", (e) => {
            this.callbacks.onCategoryChange?.((e.target as HTMLSelectElement).value);
        });
        this.cleanupFunctions.push(categoryChangeCleanup);

        // Save button
        const saveCleanup = addEventListenerWithCleanup(this.saveButton, "click", () => {
            this.callbacks.onSave?.();
        });
        this.cleanupFunctions.push(saveCleanup);

        // Cancel button
        const cancelCleanup = addEventListenerWithCleanup(this.cancelButton, "click", () => {
            this.callbacks.onCancel?.();
        });
        this.cleanupFunctions.push(cancelCleanup);
    }

    /**
     * Switch to edit layout
     */
    private switchToEditLayout(): void {
        if (!this.titleInput || !this.categorySelect || !this.saveButton || !this.cancelButton) return;

        // Replace title element with input
        setElementDisplayed(this.titleElement, false);
        this.titleElement.parentNode?.insertBefore(this.titleInput, this.titleElement);

        // Replace category element with select
        setElementDisplayed(this.categoryElement, false);
        this.categoryElement.parentNode?.insertBefore(this.categorySelect, this.categoryElement);

        // Hide view mode buttons
        setElementDisplayed(this.editButton, false);
        setElementDisplayed(this.deleteButton, false);

        // Show edit mode buttons
        const actionsContainer = this.editButton.parentElement;
        if (actionsContainer) {
            actionsContainer.appendChild(this.saveButton);
            actionsContainer.appendChild(this.cancelButton);
        }

        // Add edit mode class to header
        const header = this.titleElement.closest(".content-header");
        if (header) {
            addClass(header as HTMLElement, "edit-mode");
        }
    }

    /**
     * Switch to view layout
     */
    private switchToViewLayout(): void {
        // Show original elements
        setElementDisplayed(this.titleElement, true);
        setElementDisplayed(this.categoryElement, true);

        // Show view mode buttons
        setElementDisplayed(this.deleteButton, true);
        setElementDisplayed(this.editButton, true);

        // Remove edit mode class from header
        const header = this.titleElement.closest(".content-header");
        if (header) {
            removeClass(header as HTMLElement, "edit-mode");
        }
    }

    /**
     * Cleanup inline editing elements
     */
    private cleanupInlineEditingElements(): void {
        // Remove elements from DOM
        if (this.titleInput) {
            this.titleInput.remove();
            this.titleInput = null;
        }

        if (this.categorySelect) {
            this.categorySelect.remove();
            this.categorySelect = null;
        }

        if (this.saveButton) {
            this.saveButton.remove();
            this.saveButton = null;
        }

        if (this.cancelButton) {
            this.cancelButton.remove();
            this.cancelButton = null;
        }
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
        this.cleanupInlineEditingElements();

        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];
    }
}
