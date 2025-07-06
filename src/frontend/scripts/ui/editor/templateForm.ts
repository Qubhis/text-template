// src/frontend/scripts/ui/editor/templateForm.ts

// Template Form Component - Redesigned for Single-Mode Interface
// Handles display elements in view mode, dynamic inputs in edit mode

import { addEventListenerWithCleanup, getRequiredElement, setTextContent, addClass, removeClass } from "../../utils/domHelpers.js";

export interface TemplateFormCallbacks {
    onDescriptionChange?: (description: string) => void;
    onContentChange?: (content: string) => void;
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
 * Template Form Component - Single-Mode View/Edit
 * Uses display elements in view mode, dynamic inputs in edit mode
 */
export class TemplateForm {
    private callbacks: TemplateFormCallbacks;
    private cleanupFunctions: (() => void)[] = [];

    // View Mode Display Elements
    private viewContent: HTMLElement;
    private descriptionDisplay: HTMLElement;
    private contentDisplay: HTMLElement;

    // Edit Mode Container
    private editContent: HTMLElement;

    // Dynamic Edit Elements (created/destroyed on mode switch)
    private descriptionInput: HTMLInputElement | null = null;
    private contentTextarea: HTMLTextAreaElement | null = null;

    // State
    private currentMode: "view" | "edit" | "create" = "view";
    private currentData: TemplateDisplayData = { title: "", categoryId: "", description: "", content: "" };

    constructor(callbacks: TemplateFormCallbacks = {}) {
        this.callbacks = callbacks;

        // Get required DOM elements
        this.viewContent = getRequiredElement<HTMLElement>("viewContent");
        this.descriptionDisplay = getRequiredElement<HTMLElement>("templateDescriptionDisplay");
        this.contentDisplay = getRequiredElement<HTMLElement>("templateContentDisplay");
        this.editContent = getRequiredElement<HTMLElement>("editContent");
    }

    /**
     * Initialize the template form component
     */
    public initialize(): void {
        this.setMode("view");
        this.updateData({ title: "", categoryId: "", description: "", content: "" });
        console.log("✅ Template form initialized with display elements approach");
    }

    /**
     * Set mode - main interface for coordinator
     */
    public setMode(mode: "view" | "edit" | "create"): void {
        if (this.currentMode === mode) {
            console.log(`🔄 Form mode already set to: ${mode}. Skipping...`);
            return;
        }

        this.currentMode = mode;

        if (mode === "view") {
            this.showViewMode();
        } else if (mode === "edit" || mode === "create") {
            this.showEditMode();
        }

        console.log(`🎨 Template form mode changed to: ${mode}`);
    }

    /**
     * Update data - used by coordinator
     */
    public updateData(data: TemplateDisplayData): void {
        this.currentData = { ...data };

        if (this.currentMode === "view") {
            this.updateViewDisplay();
        } else if (this.currentMode === "edit" || this.currentMode === "create") {
            this.updateEditInputs();
        }
    }

    // Private Methods - View Mode

    /**
     * Show view mode with display elements
     */
    private showViewMode(): void {
        removeClass(this.editContent, "active");
        addClass(this.viewContent, "active");

        this.destroyEditElements();
        this.updateViewDisplay();
    }

    /**
     * Update view mode display elements
     */
    private updateViewDisplay(): void {
        // Update description display
        if (this.currentData.description && this.currentData.description.trim()) {
            setTextContent(this.descriptionDisplay, this.currentData.description);
            removeClass(this.descriptionDisplay, "empty");
        } else {
            setTextContent(this.descriptionDisplay, "No description provided");
            addClass(this.descriptionDisplay, "empty");
        }

        // Update content display
        if (this.currentData.content && this.currentData.content.trim()) {
            // For now, show raw content. In future phases, this will be processed template
            setTextContent(this.contentDisplay, this.currentData.content);
            removeClass(this.contentDisplay, "empty");
        } else {
            setTextContent(this.contentDisplay, "No content");
            addClass(this.contentDisplay, "empty");
        }
    }

    // Private Methods - Edit Mode

    /**
     * Show edit mode with input elements
     */
    private showEditMode(): void {
        removeClass(this.viewContent, "active");
        addClass(this.editContent, "active");

        this.createEditElements();
        this.updateEditInputs();
    }

    /**
     * Create dynamic edit input elements
     */
    private createEditElements(): void {
        if (this.descriptionInput || this.contentTextarea) {
            console.log("🔄 Edit elements already exist, skipping creation");
            return;
        }

        // Clear edit container
        this.editContent.innerHTML = "";

        // Create form structure
        const form = document.createElement("form");
        form.className = "template-form";

        // Description field
        const descriptionGroup = document.createElement("div");
        descriptionGroup.className = "form-group";

        const descriptionLabel = document.createElement("label");
        descriptionLabel.textContent = "Description (optional)";
        descriptionLabel.setAttribute("for", "templateDescriptionEdit");

        this.descriptionInput = document.createElement("input");
        this.descriptionInput.type = "text";
        this.descriptionInput.id = "templateDescriptionEdit";
        this.descriptionInput.className = "form-input";
        this.descriptionInput.placeholder = "Brief description";
        this.descriptionInput.maxLength = 500;

        descriptionGroup.appendChild(descriptionLabel);
        descriptionGroup.appendChild(this.descriptionInput);

        // Content field
        const contentGroup = document.createElement("div");
        contentGroup.className = "form-group";

        const contentLabel = document.createElement("label");
        contentLabel.textContent = "Template Content";
        contentLabel.setAttribute("for", "templateContentEdit");

        this.contentTextarea = document.createElement("textarea");
        this.contentTextarea.id = "templateContentEdit";
        this.contentTextarea.className = "form-textarea";
        this.contentTextarea.placeholder = "Enter your template content with {{variables}}...";
        this.contentTextarea.rows = 12;

        contentGroup.appendChild(contentLabel);
        contentGroup.appendChild(this.contentTextarea);

        // Assemble form
        form.appendChild(descriptionGroup);
        form.appendChild(contentGroup);
        this.editContent.appendChild(form);

        // Setup event listeners for new elements
        this.setupEditEventListeners();

        console.log("🎨 Created dynamic edit elements");
    }

    /**
     * Setup event listeners for edit elements
     */
    private setupEditEventListeners(): void {
        if (!this.descriptionInput || !this.contentTextarea) return;

        // Description input changes
        const descriptionChangeCleanup = addEventListenerWithCleanup(this.descriptionInput, "input", (e) => {
            this.callbacks.onDescriptionChange?.((e.target as HTMLInputElement).value);
        });
        this.cleanupFunctions.push(descriptionChangeCleanup);

        // Content textarea changes
        const contentChangeCleanup = addEventListenerWithCleanup(this.contentTextarea, "input", (e) => {
            this.callbacks.onContentChange?.((e.target as HTMLTextAreaElement).value);
        });
        this.cleanupFunctions.push(contentChangeCleanup);
    }

    /**
     * Update edit input values
     */
    private updateEditInputs(): void {
        if (!this.descriptionInput || !this.contentTextarea) return;

        this.descriptionInput.value = this.currentData.description;
        this.contentTextarea.value = this.currentData.content;
    }

    /**
     * Destroy edit elements
     */
    private destroyEditElements(): void {
        if (this.descriptionInput) {
            this.descriptionInput.remove();
            this.descriptionInput = null;
        }

        if (this.contentTextarea) {
            this.contentTextarea.remove();
            this.contentTextarea = null;
        }

        // Clear the edit container
        this.editContent.innerHTML = "";

        console.log("🧹 Destroyed dynamic edit elements");
    }

    /**
     * Get current form mode
     */
    public getCurrentMode(): "view" | "edit" | "create" {
        return this.currentMode;
    }

    /**
     * Get current data (for debugging)
     */
    public getCurrentData(): TemplateDisplayData {
        return { ...this.currentData };
    }

    /**
     * Focus content input (for create mode)
     */
    public focusContentInput(): void {
        if (this.contentTextarea) {
            this.contentTextarea.focus();
        }
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        this.destroyEditElements();

        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];

        console.log("🧹 Template form destroyed");
    }
}
