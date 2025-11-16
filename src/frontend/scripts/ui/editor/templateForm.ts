// src/frontend/scripts/ui/editor/templateForm.ts

// Template Form Component
// Handles display elements in view mode, dynamic inputs in edit mode

import {
    addEventListenerWithCleanup,
    getRequiredElement,
    setTextContent,
    addClass,
    removeClass,
    setElementTransparent,
} from "../../utils/domHelpers.js";
import { VariableValues } from "../../utils/variableParser.js";
import { FilledTextField } from "../../../components/text-fields/FilledTextField.js";
import { Category } from "../../core/apiClient.js";
import { formatDate } from "../../utils/formatters.js";

export interface TemplateFormCallbacks {
    onCategoryChange?: (category: string) => void;
    onCategoryValidate?: (categoryId: string) => string | null;
    onCategoryBlur?: () => void;
    onDescriptionChange?: (description: string) => void;
    onDescriptionValidate?: (description: string) => string | null;
    onDescriptionBlur?: () => void;
    onContentChange?: (content: string) => void;
    onContentValidate?: (content: string) => string | null;
    onContentBlur?: () => void;
    getVariableValues?: () => VariableValues; // Get current variable values
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
 * Template Form Component
 * Uses display elements in view mode, dynamic inputs in edit mode
 */
export class TemplateForm {
    private callbacks: TemplateFormCallbacks;
    private cleanupFunctions: (() => void)[] = [];

    // View Mode Display Elements
    private viewContent: HTMLElement;
    private categoryElement: HTMLElement;
    private modifiedElement: HTMLElement;
    private descriptionDisplay: HTMLElement;
    private contentDisplay: HTMLElement;
    private copyButton: HTMLButtonElement;
    private copyFeedback: HTMLElement;
    private copyWithWarningFeedback: HTMLElement;

    // Edit Mode Container
    private editContent: HTMLElement;

    // Dynamic Edit Elements (created/destroyed on mode switch)
    private categoryField: FilledTextField | null = null;
    private descriptionField: FilledTextField | null = null;
    private contentField: FilledTextField | null = null;

    // State
    private categories: Category[] = [];

    // State
    private currentMode: "view" | "edit" | "create" = "view";
    private currentData: TemplateDisplayData = { title: "", categoryId: "", description: "", content: "" };

    constructor(callbacks: TemplateFormCallbacks = {}) {
        this.callbacks = callbacks;

        // Get required DOM elements
        this.viewContent = getRequiredElement<HTMLElement>("viewContent");
        this.categoryElement = getRequiredElement<HTMLElement>("templateCategory");
        this.modifiedElement = getRequiredElement<HTMLElement>("templateModified");
        this.descriptionDisplay = getRequiredElement<HTMLElement>("templateDescriptionDisplay");
        this.contentDisplay = getRequiredElement<HTMLElement>("templateContentDisplay");
        this.editContent = getRequiredElement<HTMLElement>("editContent");
        this.copyButton = getRequiredElement<HTMLButtonElement>("copyButton");
        this.copyFeedback = getRequiredElement<HTMLElement>("copyFeedback");
        this.copyWithWarningFeedback = getRequiredElement<HTMLElement>("copyWithWarningFeedback");

        // Setup copy button (always present, never destroyed)
        this.setupCopyButton();
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
    public updateData(data: TemplateDisplayData, modifiedAt?: string): void {
        this.currentData = { ...data };

        if (this.currentMode === "view") {
            this.updateViewDisplay(modifiedAt);
        } else if (this.currentMode === "edit" || this.currentMode === "create") {
            this.updateEditInputs();
        }
    }

    /**
     * Set categories for dropdown
     */
    public setCategories(categories: Category[]): void {
        this.categories = categories;
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
    private updateViewDisplay(modifiedAt?: string): void {
        // Update category and modified info
        if (modifiedAt) {
            setTextContent(this.categoryElement, this.getCategoryNameById(this.currentData.categoryId));
            setTextContent(this.modifiedElement, `Modified ${formatDate(modifiedAt)}`);
            setElementTransparent(this.categoryElement, true);
            setElementTransparent(this.modifiedElement, true);
        } else {
            setElementTransparent(this.categoryElement, false);
            setElementTransparent(this.modifiedElement, false);
        }

        // Update description display
        if (this.currentData.description && this.currentData.description.trim()) {
            setTextContent(this.descriptionDisplay, this.currentData.description);
            removeClass(this.descriptionDisplay, "empty");
        } else {
            setTextContent(this.descriptionDisplay, "No description provided");
            addClass(this.descriptionDisplay, "empty");
        }

        // Update content display with variable highlighting
        if (this.currentData.content && this.currentData.content.trim()) {
            this.renderContentWithVariableHighlights();
            removeClass(this.contentDisplay, "empty");
        } else {
            setTextContent(this.contentDisplay, "No content");
            addClass(this.contentDisplay, "empty");
        }
    }

    private getCategoryNameById(categoryId: string): string {
        const category = this.categories.find((c) => c.id === categoryId);
        return category ? category.name : "Uncategorized";
    }

    /**
     * Render content with variable highlighting using spans
     */
    private renderContentWithVariableHighlights(): void {
        const content = this.currentData.content;
        const variableValues = this.callbacks.getVariableValues?.() ?? {};

        // Split content into chunks with variables
        const chunks = this.splitContentIntoChunks(content, variableValues);

        // Clear and populate content display
        this.contentDisplay.innerHTML = "";

        chunks.forEach((chunk) => {
            if (chunk.isVariable) {
                const span = document.createElement("span");
                span.className = chunk.isFilled ? "variable-filled" : "variable-empty";
                span.textContent = chunk.text;
                span.title = chunk.isVariable ? `Variable: ${chunk.variableName}` : "";
                this.contentDisplay.appendChild(span);
            } else {
                // Regular text - preserve line breaks
                const lines = chunk.text.split("\n");
                lines.forEach((line, index) => {
                    if (index > 0) {
                        this.contentDisplay.appendChild(document.createElement("br"));
                    }
                    if (line.trim()) {
                        const textNode = document.createTextNode(line);
                        this.contentDisplay.appendChild(textNode);
                    }
                });
            }
        });
    }

    /**
     * Split content into text and variable chunks
     */
    private splitContentIntoChunks(content: string, variableValues: { [key: string]: string }) {
        const chunks: Array<{
            text: string;
            isVariable: boolean;
            isFilled: boolean;
            variableName?: string;
        }> = [];

        const variablePattern = /\{\{([^}]*)\}\}/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = variablePattern.exec(content)) !== null) {
            // Add text before variable
            if (match.index > lastIndex) {
                chunks.push({
                    text: content.substring(lastIndex, match.index),
                    isVariable: false,
                    isFilled: false,
                });
            }

            // Add variable
            const fullMatch = match[0]; // {{variableName}}
            const innerContent = match[1].trim();

            // Parse variable name (handle both {{name}} and {{name:options}} formats)
            const colonIndex = innerContent.indexOf(":");
            const variableName = colonIndex > 0 ? innerContent.substring(0, colonIndex) : innerContent;

            const hasValue = !!(variableValues[variableName] && variableValues[variableName].trim() !== "");
            const displayText = hasValue ? variableValues[variableName] : fullMatch;

            chunks.push({
                text: displayText,
                isVariable: true,
                isFilled: hasValue,
                variableName: variableName,
            });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            chunks.push({
                text: content.substring(lastIndex),
                isVariable: false,
                isFilled: false,
            });
        }

        return chunks;
    }

    /**
     * Setup copy button event listener
     */
    private setupCopyButton(): void {
        const copyClickCleanup = addEventListenerWithCleanup(this.copyButton, "click", () => {
            this.copyTemplateContent();
        });
        this.cleanupFunctions.push(copyClickCleanup);
    }

    /**
     * Copy processed template content to clipboard
     */
    private async copyTemplateContent(): Promise<void> {
        const content = this.currentData.content;
        const variableValues = this.callbacks.getVariableValues?.() ?? {};

        // Use existing chunk logic to get processed content
        const chunks = this.splitContentIntoChunks(content, variableValues);
        const isSomeVariableValueMissing = chunks.some((chunk) => chunk.isVariable && !chunk.isFilled);
        const processedContent = chunks.map((chunk) => chunk.text).join("");

        try {
            await navigator.clipboard.writeText(processedContent);
            isSomeVariableValueMissing ? this.showCopySuccessWithWarning() : this.showCopySuccess();
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    }

    /**
     * Show copy success animation
     */
    private showCopySuccess(): void {
        addClass(this.copyButton, "copied");
        addClass(this.copyFeedback, "show");

        // Reset after 2 seconds
        setTimeout(() => {
            removeClass(this.copyButton, "copied");
            removeClass(this.copyFeedback, "show");
        }, 2000);
    }

    /**
     * Show copy success animation
     */
    private showCopySuccessWithWarning(): void {
        addClass(this.copyButton, "copied-with-warning");
        addClass(this.copyWithWarningFeedback, "show");

        // Reset after 2 seconds
        setTimeout(() => {
            removeClass(this.copyButton, "copied-with-warning");
            removeClass(this.copyWithWarningFeedback, "show");
        }, 3500);
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
        if (this.categoryField || this.descriptionField || this.contentField) {
            console.log("🔄 Edit elements already exist, skipping creation");
            return;
        }

        // Clear edit container
        this.editContent.innerHTML = "";

        // Create form structure
        const form = document.createElement("form");
        form.className = "template-form";

        // Prevent form submission
        form.addEventListener("submit", (e: Event) => {
            e.preventDefault();
        });

        // Category field
        const categoryGroup = document.createElement("div");
        categoryGroup.className = "form-group";

        this.categoryField = new FilledTextField(
            {
                label: "Category",
                value: this.currentData.categoryId,
            },
            {
                onOptionSelect: (value: string) => {
                    this.callbacks.onCategoryChange?.(value);
                    this.validateCategoryField();
                },
            }
        );

        // Set up as select with category options
        const categoryOptions = this.categories.map((cat) => cat.name);
        if (categoryOptions.length > 0) {
            this.categoryField.setSelectMode(categoryOptions);
            // Set current value by name if we have a categoryId
            if (this.currentData.categoryId) {
                const categoryName = this.getCategoryNameById(this.currentData.categoryId);
                this.categoryField.setValue(categoryName);
            }
        }

        categoryGroup.appendChild(this.categoryField.getElement());

        // Description field
        const descriptionGroup = document.createElement("div");
        descriptionGroup.className = "form-group";

        this.descriptionField = new FilledTextField(
            {
                label: "Description (optional)",
                value: this.currentData.description,
                multiline: true,
                maxLines: 10,
            },
            {
                onChange: (value: string) => {
                    this.callbacks.onDescriptionChange?.(value);
                    this.validateDescriptionField();
                },
            }
        );

        descriptionGroup.appendChild(this.descriptionField.getElement());

        // Content field
        const contentGroup = document.createElement("div");
        contentGroup.className = "form-group form-group--stretch";

        this.contentField = new FilledTextField(
            {
                label: "Template Content",
                multiline: true,
                stretchHeight: true,
                value: this.currentData.content,
            },
            {
                onChange: (value: string) => {
                    this.callbacks.onContentChange?.(value);
                    this.validateContentField();
                },
            }
        );

        contentGroup.appendChild(this.contentField.getElement());

        // Assemble form
        form.appendChild(categoryGroup);
        form.appendChild(descriptionGroup);
        form.appendChild(contentGroup);
        this.editContent.appendChild(form);

        console.log("🎨 Created dynamic edit elements with FilledTextField components");
    }

    /**
     * Update edit input values
     */
    private updateEditInputs(): void {
        if (!this.categoryField || !this.descriptionField || !this.contentField) return;

        // Update category field
        if (this.currentData.categoryId) {
            const categoryName = this.getCategoryNameById(this.currentData.categoryId);
            this.categoryField.setValue(categoryName);
        }

        this.descriptionField.setValue(this.currentData.description);
        this.contentField.setValue(this.currentData.content);
    }

    /**
     * Public API methods for coordinator validation
     */
    public setCategoryError(message: string): void {
        if (this.categoryField) {
            this.categoryField.setError(message);
        }
    }

    public clearCategoryError(): void {
        if (this.categoryField) {
            this.categoryField.clearError();
        }
    }

    public setDescriptionError(message: string): void {
        if (this.descriptionField) {
            this.descriptionField.setError(message);
        }
    }

    public clearDescriptionError(): void {
        if (this.descriptionField) {
            this.descriptionField.clearError();
        }
    }

    public setContentError(message: string): void {
        if (this.contentField) {
            this.contentField.setError(message);
        }
    }

    public clearContentError(): void {
        if (this.contentField) {
            this.contentField.clearError();
        }
    }

    /**
     * Private validation methods using coordinator callbacks
     */
    private validateCategoryField(): void {
        if (!this.categoryField) return;

        // Convert category name back to ID for validation
        const categoryName = this.categoryField.getValue();
        const category = this.categories.find((c) => c.name === categoryName);
        const categoryId = category ? category.id : "";

        const errorMessage = this.callbacks.onCategoryValidate?.(categoryId) || null;

        if (errorMessage) {
            this.categoryField.setError(errorMessage);
        } else {
            this.categoryField.clearError();
        }
    }

    private validateDescriptionField(): void {
        if (!this.descriptionField) return;

        const currentValue = this.descriptionField.getValue();
        const errorMessage = this.callbacks.onDescriptionValidate?.(currentValue) || null;

        if (errorMessage) {
            this.descriptionField.setError(errorMessage);
        } else {
            this.descriptionField.clearError();
        }
    }

    private validateContentField(): void {
        if (!this.contentField) return;

        const currentValue = this.contentField.getValue();
        const errorMessage = this.callbacks.onContentValidate?.(currentValue) || null;

        if (errorMessage) {
            this.contentField.setError(errorMessage);
        } else {
            this.contentField.clearError();
        }
    }

    /**
     * Destroy edit elements
     */
    private destroyEditElements(): void {
        if (this.categoryField) {
            this.categoryField.destroy();
            this.categoryField = null;
        }

        if (this.descriptionField) {
            this.descriptionField.destroy();
            this.descriptionField = null;
        }

        if (this.contentField) {
            this.contentField.destroy();
            this.contentField = null;
        }

        // Clear the edit container
        this.editContent.innerHTML = "";

        console.log("🧹 Destroyed dynamic edit elements");
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        this.destroyEditElements();

        // TODO: use AbortController to cleanup event handlers
        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];

        console.log("🧹 Template form destroyed");
    }
}
