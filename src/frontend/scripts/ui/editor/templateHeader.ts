// src/frontend/scripts/ui/editor/templateHeader.ts

// Template Header Component - Pure View Component
// Handles display and inline editing, communicates via callbacks

import { Template } from "../../core/apiClient.js";
import {
    getRequiredElement,
    setTextContent,
    addEventListenerWithCleanup,
    addClass,
    removeClass,
    setElementDisplayed,
} from "../../utils/domHelpers.js";
import { FilledTextField } from "../../../components/text-fields/FilledTextField.js";
import { ThreeDotMenuButton } from "../../../components/buttons/ThreeDotMenuButton.js";

export interface TemplateHeaderCallbacks {
    onTitleChange?: (title: string) => void;
    onTitleValidate?: (title: string) => string | null; // Return error message or null
    onSave?: () => void;
    onCancel?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onExport?: () => void;
}

/**
 * Template data for display
 */
interface TemplateDisplayData {
    title: string;
    // TODO: remove unused attributes - leftovers from refactoring
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
    private editButton: HTMLButtonElement;
    private menuButton: ThreeDotMenuButton;

    // Inline editing elements (created dynamically)
    private titleField: FilledTextField | null = null;
    private saveButton: HTMLButtonElement | null = null;
    private cancelButton: HTMLButtonElement | null = null;

    // State
    private currentMode: "view" | "edit" | "create" = "view";

    constructor(callbacks: TemplateHeaderCallbacks = {}) {
        this.callbacks = callbacks;

        // Get required DOM elements
        this.titleElement = getRequiredElement<HTMLElement>("templateTitle");
        this.editButton = getRequiredElement<HTMLButtonElement>("editTemplateBtn");

        // Create three-dot menu button
        this.menuButton = new ThreeDotMenuButton({
            items: [
                {
                    label: "Export to JSON",
                    action: () => this.callbacks.onExport?.(),
                },
                {
                    label: "Delete",
                    action: () => this.callbacks.onDelete?.(),
                    danger: true,
                },
            ],
        });
        // start in disabled state for initial app load without any template selected
        this.menuButton.disable();

        // Append menu button to actions container
        const actionsContainer = this.editButton.parentElement;
        if (actionsContainer) {
            actionsContainer.appendChild(this.menuButton.getElement());
        }
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
                this.showTemplateInfo(data.title);
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
     * Focus title input (for create mode)
     */
    public focusTitleInput(): void {
        if (this.titleField) {
            this.titleField.focus();
        }
    }

    /**
     * Set title field error (called from coordinator)
     */
    public setTitleError(message: string): void {
        if (this.titleField) {
            this.titleField.setError(message);
        }
    }

    /**
     * Clear title field error (called from coordinator)
     */
    public clearTitleError(): void {
        if (this.titleField) {
            this.titleField.clearError();
        }
    }

    /**
     * Enable or disable save button based on validation state
     */
    public setSaveButtonEnabled(enabled: boolean): void {
        if (this.saveButton) {
            this.saveButton.disabled = !enabled;
        }
    }

    // Private methods

    /**
     * Show template information in header
     */
    private showTemplateInfo(title: string): void {
        setTextContent(this.titleElement, title);
    }

    /**
     * Show empty state when no template selected
     */
    private showEmptyState(): void {
        setTextContent(this.titleElement, "Select a template");
    }

    /**
     * Enter edit mode with inline editing
     */
    private enterEditMode(): void {
        console.trace("🎨 Entering edit mode...");
        if (!this.titleField) {
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
        // Create title field using FilledTextField
        this.titleField = new FilledTextField(
            {
                label: "Title",
                isRequired: true,
                value: "",
                maxLength: 50,
            },
            {
                onChange: (value: string) => {
                    this.callbacks.onTitleChange?.(value);
                    this.validateTitleField();
                },
            }
        );

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
        if (!this.titleField) throw new Error("Inline editing elements not created");
        this.titleField.setValue(data.title);
    }

    /**
     * Setup event listeners for inline editing elements
     */
    private setupInlineEditingListeners(): void {
        if (!this.titleField || !this.saveButton || !this.cancelButton) return;

        // Note: Title changes are handled by FilledTextField callback in constructor

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
        if (!this.titleField || !this.saveButton || !this.cancelButton) return;

        // Replace title element with FilledTextField
        setElementDisplayed(this.titleElement, false);
        this.titleElement.parentNode?.insertBefore(this.titleField.getElement(), this.titleElement);

        // Hide view mode buttons
        setElementDisplayed(this.editButton, false);
        setElementDisplayed(this.menuButton.getElement(), false);

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

        // Show view mode buttons
        setElementDisplayed(this.editButton, true);
        setElementDisplayed(this.menuButton.getElement(), true);

        // Remove edit mode class from header
        const header = this.titleElement.closest(".content-header");
        if (header) {
            removeClass(header as HTMLElement, "edit-mode");
        }
    }

    /**
     * Validate title field using coordinator callback
     */
    private validateTitleField(): void {
        if (!this.titleField) return;

        const currentValue = this.titleField.getValue();
        const errorMessage = this.callbacks.onTitleValidate?.(currentValue) || null;

        if (errorMessage) {
            this.titleField.setError(errorMessage);
        } else {
            this.titleField.clearError();
        }
    }

    /**
     * Cleanup inline editing elements
     */
    private cleanupInlineEditingElements(): void {
        // Destroy FilledTextField component
        if (this.titleField) {
            this.titleField.destroy();
            this.titleField = null;
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
        if (enabled) {
            this.menuButton.enable();
        } else {
            this.menuButton.disable();
        }
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        this.cleanupInlineEditingElements();

        // Destroy menu button
        this.menuButton.destroy();

        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];
    }
}
