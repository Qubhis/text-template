// src/frontend/scripts/ui/templateForm.ts

// Template Form Component
// Handles template form CRUD operations, validation, and state management

import { Template, CreateTemplateInput, UpdateTemplateInput, Category } from "../core/apiClient.js";
import DataManager from "../core/dataManager.js";
import { getRequiredElement, addEventListenerWithCleanup, focusElement } from "../utils/domHelpers.js";

export interface TemplateFormCallbacks {
    onModeChange?: (mode: "view" | "edit" | "create") => void;
    onFormDirtyChange?: (isDirty: boolean) => void;
    onSwitchToTab?: (tabName: string) => void;
    onShowUnsavedChangesModal?: (onConfirm: () => void) => void;
    onShowError?: (title: string, message: string) => void;
    onShowLoading?: (message: string) => void;
    onHideLoading?: () => void;
}

interface TemplateFormData {
    title: string;
    category: string;
    description: string;
    content: string;
}

/**
 * Template Form Component
 * Manages template editing form and CRUD operations
 */
export class TemplateForm {
    private dataManager: DataManager;
    private callbacks: TemplateFormCallbacks;
    private cleanupFunctions: (() => void)[] = [];

    // DOM Elements
    private titleInput: HTMLInputElement;
    private categorySelect: HTMLSelectElement;
    private descriptionInput: HTMLInputElement;
    private contentTextarea: HTMLTextAreaElement;
    private saveButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;

    // State
    private currentMode: "view" | "edit" | "create" = "view";
    private formIsDirty = false;

    constructor(dataManager: DataManager, callbacks: TemplateFormCallbacks = {}) {
        this.dataManager = dataManager;
        this.callbacks = callbacks;

        // Get required DOM elements
        this.titleInput = getRequiredElement<HTMLInputElement>("templateTitleInput");
        this.categorySelect = getRequiredElement<HTMLSelectElement>("templateCategorySelect");
        this.descriptionInput = getRequiredElement<HTMLInputElement>("templateDescriptionInput");
        this.contentTextarea = getRequiredElement<HTMLTextAreaElement>("templateContent");
        this.saveButton = getRequiredElement<HTMLButtonElement>("saveTemplateBtn");
        this.cancelButton = getRequiredElement<HTMLButtonElement>("cancelEditBtn");
    }

    /**
     * Initialize the template form component
     */
    public initialize(): void {
        this.setupEventListeners();
        this.setFormReadOnly(true);
        this.updateFormButtons();
    }

    /**
     * Set up form event listeners
     */
    private setupEventListeners(): void {
        // Save button
        const saveCleanup = addEventListenerWithCleanup(this.saveButton, "click", () => this.saveTemplate());
        this.cleanupFunctions.push(saveCleanup);

        // Cancel button
        const cancelCleanup = addEventListenerWithCleanup(this.cancelButton, "click", () => this.cancelEdit());
        this.cleanupFunctions.push(cancelCleanup);

        // Form change listeners for dirty state tracking
        this.setupFormChangeListeners();
    }

    /**
     * Setup form change listeners for dirty state tracking
     */
    private setupFormChangeListeners(): void {
        const formElements = [this.titleInput, this.categorySelect, this.descriptionInput, this.contentTextarea];

        formElements.forEach((element) => {
            const cleanup = addEventListenerWithCleanup(element, "input", () => {
                if (this.currentMode !== "view") {
                    this.setFormDirty(true);
                }
            });
            this.cleanupFunctions.push(cleanup);
        });
    }

    /**
     * Load template into form (automatically switches to view mode)
     */
    public loadTemplate(template: Template): void {
        try {
            this.titleInput.value = template.title || "";
            this.categorySelect.value = template.category || "";
            this.descriptionInput.value = template.description || "";
            this.contentTextarea.value = template.content || "";

            // Loading a template always means viewing it
            this.setMode("view");
            this.setFormDirty(false);
        } catch (error) {
            console.error("Error loading template into form:", error);
            this.callbacks.onShowError?.("Form Error", "Failed to load template data into form.");
        }
    }

    /**
     * Clear template form (automatically switches to view mode)
     */
    public clearForm(): void {
        this.titleInput.value = "";
        this.categorySelect.value = "";
        this.descriptionInput.value = "";
        this.contentTextarea.value = "";

        // Clearing form means going back to view mode
        this.setMode("view");
        this.setFormDirty(false);
    }

    /**
     * Start creating new template
     */
    public startCreate(): void {
        if (this.formIsDirty) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithCreate();
            });
        } else {
            this.proceedWithCreate();
        }
    }

    /**
     * Start editing current template
     */
    public startEdit(): void {
        const currentTemplateId = this.getCurrentTemplateId();
        if (!currentTemplateId) {
            this.callbacks.onShowError?.("No Template Selected", "Please select a template to edit.");
            return;
        }

        if (this.formIsDirty) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithEdit();
            });
        } else {
            this.proceedWithEdit();
        }
    }

    /**
     * Cancel edit/create operation
     */
    public cancelEdit(): void {
        if (this.formIsDirty) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithCancel();
            });
        } else {
            this.proceedWithCancel();
        }
    }

    /**
     * Update categories dropdown
     */
    public updateCategories(categories: Category[]): void {
        // Keep the default option and add categories
        const defaultOption = this.categorySelect.querySelector('option[value=""]');
        this.categorySelect.innerHTML = "";

        if (defaultOption) {
            this.categorySelect.appendChild(defaultOption);
        }

        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            this.categorySelect.appendChild(option);
        });
    }

    /**
     * Get current form mode
     */
    public getCurrentMode(): "view" | "edit" | "create" {
        return this.currentMode;
    }

    /**
     * Check if form is dirty
     */
    public isFormDirty(): boolean {
        return this.formIsDirty;
    }

    // Private methods

    private proceedWithCreate(): void {
        this.clearForm();
        this.setMode("create");
        this.setFormReadOnly(false);
        this.updateFormButtons();
        this.callbacks.onSwitchToTab?.("edit");
        focusElement(this.titleInput);
        console.log("Showing create template form");
    }

    private proceedWithEdit(): void {
        this.setMode("edit");
        this.setFormReadOnly(false);
        this.updateFormButtons();
        this.callbacks.onSwitchToTab?.("edit");
        focusElement(this.titleInput);
        console.log("Editing template:", this.getCurrentTemplateId());
    }

    private proceedWithCancel(): void {
        if (this.currentMode === "create") {
            this.setMode("view");
            this.clearForm();
            this.setFormReadOnly(true);
            this.dataManager.selectTemplate(null);
        } else if (this.currentMode === "edit") {
            this.setMode("view");
            const currentTemplateId = this.getCurrentTemplateId();
            if (currentTemplateId) {
                const template = this.dataManager.getTemplate(currentTemplateId);
                if (template) {
                    this.loadTemplate(template);
                } else {
                    this.clearForm();
                }
            }
            this.setFormReadOnly(true);
        }

        this.setFormDirty(false);
        this.updateFormButtons();
        console.log("Cancelled edit operation");
    }

    private async saveTemplate(): Promise<void> {
        try {
            const formData = this.getFormData();
            const validation = this.validateForm(formData);

            if (!validation.isValid) {
                this.callbacks.onShowError?.("Validation Error", validation.errors.join("\n"));
                return;
            }

            this.callbacks.onShowLoading?.("Saving template...");

            if (this.currentMode === "create") {
                const createData: CreateTemplateInput = {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category || undefined,
                    description: formData.description || undefined,
                };

                const newTemplate = await this.dataManager.createTemplate(createData);
                if (newTemplate) {
                    this.setMode("view");
                    this.setFormDirty(false);
                    this.setFormReadOnly(true);
                    this.updateFormButtons();
                }
            } else if (this.currentMode === "edit") {
                const currentTemplateId = this.getCurrentTemplateId();
                if (!currentTemplateId) {
                    throw new Error("No template selected for editing");
                }

                const updateData: UpdateTemplateInput = {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category || undefined,
                    description: formData.description || undefined,
                };

                const updatedTemplate = await this.dataManager.updateTemplate(currentTemplateId, updateData);
                if (updatedTemplate) {
                    this.setMode("view");
                    this.setFormDirty(false);
                    this.setFormReadOnly(true);
                    this.updateFormButtons();
                }
            }
        } catch (error) {
            console.error("Error saving template:", error);
            this.callbacks.onShowError?.("Save Failed", "Failed to save template. Please try again.");
        } finally {
            this.callbacks.onHideLoading?.();
        }
    }

    private getFormData(): TemplateFormData {
        return {
            title: this.titleInput.value.trim() || "",
            category: this.categorySelect.value || "",
            description: this.descriptionInput.value.trim() || "",
            content: this.contentTextarea.value || "",
        };
    }

    private validateForm(data: Partial<TemplateFormData>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.title) {
            errors.push("Title is required");
        }

        if (!data.content) {
            errors.push("Content is required");
        }

        if (data.title && data.title.length > 200) {
            errors.push("Title cannot exceed 200 characters");
        }

        if (!data.category) {
            errors.push("Category is required");
        }

        if (data.description && data.description.length > 500) {
            errors.push("Description cannot exceed 500 characters");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    private setFormReadOnly(readOnly: boolean): void {
        try {
            this.titleInput.disabled = readOnly;
            this.categorySelect.disabled = readOnly;
            this.descriptionInput.disabled = readOnly;
            this.contentTextarea.disabled = readOnly;

            // Update visual styling
            const formElements = [this.titleInput, this.categorySelect, this.descriptionInput, this.contentTextarea];
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

    private updateFormButtons(): void {
        try {
            const isEditing = this.currentMode === "edit" || this.currentMode === "create";

            this.saveButton.disabled = !isEditing;
            this.cancelButton.disabled = !isEditing;

            // Update save button text
            if (this.currentMode === "create") {
                this.saveButton.textContent = "Create Template";
            } else if (this.currentMode === "edit") {
                this.saveButton.textContent = "Save Changes";
            } else {
                this.saveButton.textContent = "Save Template";
            }
        } catch (error) {
            console.error("Error updating form buttons:", error);
        }
    }

    /**
     * Set form mode
     */
    public setMode(mode: "view" | "edit" | "create"): void {
        this.currentMode = mode;
        this.setFormReadOnly(mode === "view");
        this.updateFormButtons();
        this.callbacks.onModeChange?.(mode);
    }

    private setFormDirty(dirty: boolean): void {
        this.formIsDirty = dirty;
        this.updateFormButtons();
        this.callbacks.onFormDirtyChange?.(dirty);
    }

    public getFormDirty(): boolean {
        return this.formIsDirty;
    }

    private getCurrentTemplateId(): string | null {
        const state = this.dataManager.getState();
        return state.selectedTemplateId;
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
