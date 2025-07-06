// src/frontend/scripts/ui/editor/templateForm.ts

// Template Form Component - Pure View Component
// Handles form display for description and content only

import { addEventListenerWithCleanup, focusElement } from "../../utils/domHelpers.js";
import { getRequiredElement } from "../../utils/domHelpers.js";

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
 * Template Form Component - Pure View
 * Manages description and content fields only (title/category in header)
 */
export class TemplateForm {
    private callbacks: TemplateFormCallbacks;
    private cleanupFunctions: (() => void)[] = [];

    // DOM Elements (only description and content)
    private descriptionInput: HTMLInputElement;
    private contentTextarea: HTMLTextAreaElement;

    // State
    private currentMode: "view" | "edit" | "create" = "view";

    constructor(callbacks: TemplateFormCallbacks = {}) {
        this.callbacks = callbacks;

        // Get required DOM elements
        this.descriptionInput = getRequiredElement<HTMLInputElement>("templateDescriptionInput");
        this.contentTextarea = getRequiredElement<HTMLTextAreaElement>("templateContent");
    }

    /**
     * Initialize the template form component
     */
    public initialize(): void {
        this.setupEventListeners();
        this.setMode("view");
        this.updateData({ title: "", categoryId: "", description: "", content: "" });
    }

    /**
     * Set mode and data - main interface for coordinator
     */
    public setMode(mode: "view" | "edit" | "create"): void {
        this.currentMode = mode;
        // Set read-only state based on mode
        const isReadOnly = mode === "view";
        this.setFormReadOnly(isReadOnly);
    }

    public updateData(data: TemplateDisplayData): void {
        this.descriptionInput.value = data.description;
        this.contentTextarea.value = data.content;
    }

    /**
     * Set up form event listeners
     */
    private setupEventListeners(): void {
        // Description input changes
        const descriptionChangeCleanup = addEventListenerWithCleanup(this.descriptionInput, "input", (e) => {
            if (this.currentMode !== "view") {
                this.callbacks.onDescriptionChange?.((e.target as HTMLInputElement).value);
            }
        });
        this.cleanupFunctions.push(descriptionChangeCleanup);

        // Content textarea changes
        const contentChangeCleanup = addEventListenerWithCleanup(this.contentTextarea, "input", (e) => {
            if (this.currentMode !== "view") {
                this.callbacks.onContentChange?.((e.target as HTMLTextAreaElement).value);
            }
        });
        this.cleanupFunctions.push(contentChangeCleanup);
    }

    /**
     * Set form read-only state
     */
    private setFormReadOnly(readOnly: boolean): void {
        try {
            this.descriptionInput.disabled = readOnly;
            this.contentTextarea.disabled = readOnly;

            // Update visual styling
            const formElements = [this.descriptionInput, this.contentTextarea];
            formElements.forEach((element) => {
                if (readOnly) {
                    element.classList.add("read-only");
                } else {
                    element.classList.remove("read-only");
                }
            });
        } catch (error) {
            console.error("Error setting form read-only state:", error);
        }
    }

    /**
     * Get current form mode
     */
    public getCurrentMode(): "view" | "edit" | "create" {
        return this.currentMode;
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
