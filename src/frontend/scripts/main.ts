// src/frontend/scripts/main.ts
// Frontend Application Entry Point & Initialization
// Initializes all managers and sets up the application

// FIXME: after deleting the header keeps title, category and change date of the last deleted template

import TemplateManager, { isSearchChangedEventParameters, StateChangeEvent } from "./templateManager.js";
import { CreateTemplateInput, isTemplate, Template, UpdateTemplateInput } from "./apiClient.js";
import UIErrorHandler from "./uiErrorHandler.js";

interface TemplateFormData {
    title: string;
    category: string;
    description: string;
    content: string;
}

/**
 * Application class - main coordinator
 */
class App {
    private templateManager: TemplateManager;
    private errorHandler: UIErrorHandler;
    private currentMode: "view" | "edit" | "create" = "view";
    private formIsDirty = false;

    constructor(templateManager: TemplateManager) {
        this.templateManager = templateManager;
        this.errorHandler = new UIErrorHandler(templateManager);
    }

    /**
     * Initialize the application UI and event listeners
     */
    async initialize(): Promise<void> {
        try {
            console.log("🚀 Initializing Text Templates App UI...");

            // Setup basic UI event listeners
            console.log("🎨 Setting up UI event listeners...");
            this.setupBasicUIListeners();

            // Setup template manager event listeners for UI updates
            console.log("🔗 Connecting template manager to UI...");
            this.setupTemplateManagerListeners();

            // Load initial data and update UI
            console.log("📋 Loading initial template list...");
            this.loadInitialData();

            // Set initial form state
            this.setFormReadOnly(true);
            this.updateFormButtons();

            console.log("✅ Application UI initialized successfully!");

            // Show success notification
            this.errorHandler.showSuccess("Application Ready", "Text Templates application loaded successfully!");
        } catch (error) {
            console.error("❌ Failed to initialize application UI:", error);
            this.errorHandler.showError("Initialization Failed", "Failed to initialize the user interface. Please refresh the page.");
            throw error; // Re-throw to let caller handle
        }
    }

    /**
     * Setup basic UI event listeners (non-template related)
     */
    private setupBasicUIListeners(): void {
        // Tab switching
        const tabButtons = document.querySelectorAll(".tab-btn");
        tabButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
                const target = e.target as HTMLElement;
                const tabName = target.getAttribute("data-tab");
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Modal close handlers
        const confirmNo = document.getElementById("confirmNo");
        if (confirmNo) {
            confirmNo.addEventListener("click", () => {
                this.hideModal();
            });
        }

        // Search functionality
        const searchInput = document.getElementById("templateSearch") as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const query = (e.target as HTMLInputElement).value;
                this.templateManager.searchTemplates(query);
            });
        }

        // Create new template button
        const createBtn = document.getElementById("createTemplateBtn");
        if (createBtn) {
            createBtn.addEventListener("click", () => {
                this.showCreateTemplateForm();
            });
        }

        // Save template button
        const saveBtn = document.getElementById("saveTemplateBtn");
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                this.saveTemplate();
            });
        }

        // Cancel edit button
        const cancelBtn = document.getElementById("cancelEditBtn");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                this.cancelEdit();
            });
        }

        // Edit template button
        const editBtn = document.getElementById("editTemplateBtn");
        if (editBtn) {
            editBtn.addEventListener("click", () => {
                this.editCurrentTemplate();
            });
        }

        // Delete template button
        const deleteBtn = document.getElementById("deleteTemplateBtn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                this.deleteCurrentTemplate();
            });
        }

        // Form change listeners for dirty state tracking
        this.setupFormChangeListeners();

        console.log("✅ Basic UI listeners set up");
    }

    /**
     * Setup template manager event listeners for UI updates
     */
    private setupTemplateManagerListeners(): void {
        // Templates loaded - update sidebar
        this.templateManager.addEventListener("templates-loaded", (event: string, data: unknown) => {
            const templates: unknown[] = !Array.isArray(data) ? [data] : data;
            const nonTemplates = templates.filter((template) => !isTemplate(template));
            if (nonTemplates.length > 0) {
                console.error("Invalid template data received from template manager:", templates);
                return;
            }
            this.updateTemplateList(templates as Template[]);
        });

        // Templates list changes events
        const templateListChangeEvents: StateChangeEvent[] = ["template-created", "template-updated", "template-deleted"];
        templateListChangeEvents.forEach((eventName) => {
            this.templateManager.addEventListener(eventName, (event: string, data: unknown) => {
                this.refreshTemplateList();
            });
        });

        // Template selected - update main content
        this.templateManager.addEventListener("template-selected", (event: string, data: unknown) => {
            if (!isTemplate(data)) {
                console.error("Invalid template data received from template manager:", data);
                return;
            }
            this.handleTemplateSelected(data);
        });

        // Search results - update filtered list
        this.templateManager.addEventListener("search-changed", (event: string, data: unknown) => {
            if (!isSearchChangedEventParameters(data)) {
                console.error("Invalid search data received from template manager:", data);
                return;
            }
            this.updateTemplateList(data.results);
        });

        console.log("✅ Template manager listeners set up");
    }

    /**
     * Load initial data
     */
    private loadInitialData(): void {
        this.refreshTemplateList();

        // Load categories for the dropdown
        const categories = this.templateManager.getCategories();
        this.updateCategoriesDropdown(categories);
    }

    private refreshTemplateList(): void {
        // Template manager will automatically load templates during initialization
        // We just need to update the UI with the current state
        const state = this.templateManager.getState();
        this.updateTemplateList(state.filteredTemplates);
    }

    /**
     * Handle template selection from TemplateManager
     */
    private handleTemplateSelected(template: Template): void {
        // Check if we have unsaved changes before switching
        if (this.formIsDirty && template?.id !== this.getCurrentTemplateId()) {
            this.showUnsavedChangesModal(() => {
                this.proceedWithTemplateSelection(template);
            });
        } else {
            this.proceedWithTemplateSelection(template);
        }
    }

    /**
     * Proceed with template selection after handling unsaved changes
     */
    private proceedWithTemplateSelection(template: Template): void {
        this.updateSelectedTemplate(template);

        if (template) {
            // Switch to view mode and load template
            this.currentMode = "view";
            this.loadTemplateIntoForm(template);
            this.setFormReadOnly(true);
        } else {
            // No template selected
            if (this.currentMode !== "create") {
                this.clearTemplateForm();
                this.setFormReadOnly(true);
                this.currentMode = "view";
            }
        }

        this.formIsDirty = false;
        this.updateFormButtons();
    }

    /**
     * Update UI to reflect selected template
     */
    private updateSelectedTemplate(template: Template): void {
        // Update header
        const titleElement = document.getElementById("templateTitle");
        const categoryElement = document.getElementById("templateCategory");
        const modifiedElement = document.getElementById("templateModified");

        if (template) {
            if (titleElement) titleElement.textContent = template.title;
            if (categoryElement) {
                categoryElement.textContent = template.category || "Uncategorized";
                categoryElement.style.display = "inline";
            }
            if (modifiedElement) {
                modifiedElement.textContent = `Modified ${this.formatDate(template.modified)}`;
                modifiedElement.style.display = "inline";
            }

            // Enable action buttons
            this.enableActionButtons(true);
            // Update active template in sidebar
            this.updateActiveTemplateInSidebar(template.id);
        } else {
            if (titleElement) titleElement.textContent = "Select a template";
            if (categoryElement) categoryElement.style.display = "none";
            if (modifiedElement) modifiedElement.style.display = "none";

            // Disable action buttons
            this.enableActionButtons(false);
            // Clear active template in sidebar
            this.updateActiveTemplateInSidebar(null);
        }
    }

    /**
     * Update template list in sidebar
     */
    private updateTemplateList(templates: Template[]): void {
        const templateList = document.getElementById("templateList");
        if (!templateList) {
            console.error("Template list element not found");
            return;
        }

        if (templates.length === 0) {
            templateList.innerHTML = `
                <div class="loading">
                    <p>No templates found.</p>
                    <p class="text-muted">Create your first template to get started!</p>
                </div>
            `;
            return;
        }

        templateList.innerHTML = templates
            .map(
                (template) => `
            <div class="template-item" data-template-id="${template.id}">
                <div class="template-item-title">${this.escapeHtml(template.title)}</div>
                <div class="template-item-meta">
                    <span class="category-tag">${this.escapeHtml(template.category || "Uncategorized")}</span>
                    <span class="template-date">${this.formatDate(template.modified)}</span>
                </div>
            </div>
        `
            )
            .join("");

        // Add click listeners to template items
        const templateItems = templateList.querySelectorAll(".template-item");
        templateItems.forEach((item) => {
            item.addEventListener("click", () => {
                const templateId = item.getAttribute("data-template-id");
                if (templateId) {
                    this.selectTemplate(templateId);
                }
            });
        });
    }

    /**
     * Update categories dropdown
     */
    private updateCategoriesDropdown(categories: any[]): void {
        const categorySelect = document.getElementById("templateCategorySelect") as HTMLSelectElement;
        if (!categorySelect) return;

        // Keep the default option and add categories
        const defaultOption = categorySelect.querySelector('option[value=""]');
        categorySelect.innerHTML = "";

        if (defaultOption) {
            categorySelect.appendChild(defaultOption);
        }

        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    /**
     * Select a template
     */
    private selectTemplate(templateId: string): void {
        this.templateManager.selectTemplate(templateId);
    }

    /**
     * Switch tabs
     */
    private switchTab(tabName: string): void {
        // Update tab buttons
        const tabButtons = document.querySelectorAll(".tab-btn");
        tabButtons.forEach((btn) => {
            btn.classList.remove("active");
            if (btn.getAttribute("data-tab") === tabName) {
                btn.classList.add("active");
            }
        });

        // Update tab panes
        const tabPanes = document.querySelectorAll(".tab-pane");
        tabPanes.forEach((pane) => {
            pane.classList.remove("active");
            if (pane.id === `${tabName}Tab`) {
                pane.classList.add("active");
            }
        });

        console.log(`Switched to ${tabName} tab`);
    }

    /**
     * Show create template form
     */
    private showCreateTemplateForm(): void {
        if (this.formIsDirty) {
            this.showUnsavedChangesModal(() => {
                this.proceedWithCreateForm();
            });
        } else {
            this.proceedWithCreateForm();
        }
    }

    /**
     * Proceed with showing create form
     */
    private proceedWithCreateForm(): void {
        // Clear the form
        this.clearTemplateForm();

        // Set create mode
        this.currentMode = "create";
        this.formIsDirty = false;

        // Update UI state
        this.setFormReadOnly(false);
        this.updateFormButtons();

        // Switch to edit tab
        this.switchTab("edit");

        // Focus on title input
        const titleInput = document.getElementById("templateTitleInput") as HTMLInputElement;
        if (titleInput) {
            titleInput.focus();
        }

        // Deselect any selected template
        this.templateManager.selectTemplate(null);

        console.log("Showing create template form");
    }

    /**
     * Clear template form
     */
    private clearTemplateForm(): void {
        const titleInput = document.getElementById("templateTitleInput") as HTMLInputElement;
        const categorySelect = document.getElementById("templateCategorySelect") as HTMLSelectElement;
        const descriptionInput = document.getElementById("templateDescriptionInput") as HTMLInputElement;
        const contentTextarea = document.getElementById("templateContent") as HTMLTextAreaElement;

        if (titleInput) titleInput.value = "";
        if (categorySelect) categorySelect.value = "";
        if (descriptionInput) descriptionInput.value = "";
        if (contentTextarea) contentTextarea.value = "";

        this.formIsDirty = false;
    }

    /**
     * Load template data into form with error handling
     */
    private loadTemplateIntoForm(template: any): void {
        try {
            const titleInput = document.getElementById("templateTitleInput") as HTMLInputElement;
            const categorySelect = document.getElementById("templateCategorySelect") as HTMLSelectElement;
            const descriptionInput = document.getElementById("templateDescriptionInput") as HTMLInputElement;
            const contentTextarea = document.getElementById("templateContent") as HTMLTextAreaElement;

            if (!titleInput || !categorySelect || !descriptionInput || !contentTextarea) {
                throw new Error("Form elements not found");
            }

            titleInput.value = template.title || "";
            categorySelect.value = template.category || "";
            descriptionInput.value = template.description || "";
            contentTextarea.value = template.content || "";

            this.formIsDirty = false;
        } catch (error) {
            console.error("Error loading template into form:", error);
            this.errorHandler.showError("Form Error", "Failed to load template data into form.");
        }
    }

    /**
     * Set form read-only state with error handling
     */
    private setFormReadOnly(readOnly: boolean): void {
        try {
            const titleInput = document.getElementById("templateTitleInput") as HTMLInputElement;
            const categorySelect = document.getElementById("templateCategorySelect") as HTMLSelectElement;
            const descriptionInput = document.getElementById("templateDescriptionInput") as HTMLInputElement;
            const contentTextarea = document.getElementById("templateContent") as HTMLTextAreaElement;

            if (!titleInput || !categorySelect || !descriptionInput || !contentTextarea) {
                throw new Error("Form elements not found");
            }

            titleInput.readOnly = readOnly;
            categorySelect.disabled = readOnly;
            descriptionInput.readOnly = readOnly;
            contentTextarea.readOnly = readOnly;

            // Update visual styling
            const formElements = [titleInput, categorySelect, descriptionInput, contentTextarea];
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
     * Setup form change listeners for dirty state tracking
     */
    private setupFormChangeListeners(): void {
        const formElements = ["templateTitleInput", "templateCategorySelect", "templateDescriptionInput", "templateContent"];

        formElements.forEach((elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener("input", () => {
                    if (this.currentMode !== "view") {
                        this.formIsDirty = true;
                        this.updateFormButtons();
                    }
                });
            }
        });
    }

    /**
     * Update form buttons based on current mode and state
     */
    private updateFormButtons(): void {
        try {
            const saveBtn = document.getElementById("saveTemplateBtn") as HTMLButtonElement;
            const cancelBtn = document.getElementById("cancelEditBtn") as HTMLButtonElement;

            if (!saveBtn || !cancelBtn) {
                throw new Error("Form buttons not found");
            }

            const isEditing = this.currentMode === "edit" || this.currentMode === "create";

            // Always show buttons but enable/disable based on state
            saveBtn.disabled = !isEditing;
            cancelBtn.disabled = !isEditing;

            // Update save button text and state
            if (this.currentMode === "create") {
                saveBtn.textContent = "Create Template";
            } else if (this.currentMode === "edit") {
                saveBtn.textContent = "Save Changes";
            } else {
                saveBtn.textContent = "Save Template";
            }
        } catch (error) {
            console.error("Error updating form buttons:", error);
        }
    }

    /**
     * Save template (create or update) with loading states
     */
    private async saveTemplate(): Promise<void> {
        try {
            const formData = this.getFormData();
            const validation = this.validateForm(formData);

            if (!validation.isValid) {
                this.errorHandler.showError("Validation Error", validation.errors.join("\n"));
                return;
            }

            // Show loading state
            this.errorHandler.showLoading("Saving template...");

            if (this.currentMode === "create") {
                const createData: CreateTemplateInput = {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category || undefined,
                    description: formData.description || undefined,
                };

                const newTemplate = await this.templateManager.createTemplate(createData);
                if (newTemplate) {
                    this.currentMode = "view";
                    this.formIsDirty = false;
                    this.setFormReadOnly(true);
                    this.updateFormButtons();
                    // Template manager will emit events and update UI automatically
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

                const updatedTemplate = await this.templateManager.updateTemplate(currentTemplateId, updateData);
                if (updatedTemplate) {
                    this.currentMode = "view";
                    this.formIsDirty = false;
                    this.setFormReadOnly(true);
                    this.updateFormButtons();
                    // Template manager will emit events and update UI automatically
                }
            }
        } catch (error) {
            console.error("Error saving template:", error);
            this.errorHandler.showError("Save Failed", "Failed to save template. Please try again.");
        } finally {
            this.errorHandler.hideLoading();
        }
    }

    /**
     * Edit current template
     */
    private editCurrentTemplate(): void {
        const currentTemplateId = this.getCurrentTemplateId();
        if (!currentTemplateId) {
            this.errorHandler.showWarning("No Template Selected", "Please select a template to edit.");
            return;
        }

        if (this.formIsDirty) {
            this.showUnsavedChangesModal(() => {
                this.proceedWithEdit();
            });
        } else {
            this.proceedWithEdit();
        }
    }

    /**
     * Proceed with edit after handling unsaved changes
     */
    private proceedWithEdit(): void {
        this.currentMode = "edit";
        this.setFormReadOnly(false);
        this.updateFormButtons();
        this.switchTab("edit");

        const titleInput = document.getElementById("templateTitleInput") as HTMLInputElement;
        if (titleInput) {
            titleInput.focus();
        }

        console.log("Editing template:", this.getCurrentTemplateId());
    }

    /**
     * Cancel edit/create operation
     */
    private cancelEdit(): void {
        if (this.formIsDirty) {
            this.showUnsavedChangesModal(() => {
                this.proceedWithCancel();
            });
        } else {
            this.proceedWithCancel();
        }
    }

    /**
     * Proceed with cancel after handling unsaved changes
     */
    private proceedWithCancel(): void {
        if (this.currentMode === "create") {
            // Go back to view mode with no template selected
            this.currentMode = "view";
            this.clearTemplateForm();
            this.setFormReadOnly(true);
            this.templateManager.selectTemplate(null);
        } else if (this.currentMode === "edit") {
            // Reload the original template data
            this.currentMode = "view";
            const currentTemplateId = this.getCurrentTemplateId();
            if (currentTemplateId) {
                const template = this.templateManager.getTemplate(currentTemplateId);
                if (template) {
                    this.loadTemplateIntoForm(template);
                } else {
                    this.clearTemplateForm();
                }
            }
            this.setFormReadOnly(true);
        }

        this.formIsDirty = false;
        this.updateFormButtons();

        console.log("Cancelled edit operation");
    }

    /**
     * Delete current template with loading states
     */
    private async deleteCurrentTemplate(): Promise<void> {
        const currentTemplateId = this.getCurrentTemplateId();
        if (!currentTemplateId) {
            this.errorHandler.showWarning("No Template Selected", "Please select a template to delete.");
            return;
        }

        const template = this.templateManager.getTemplate(currentTemplateId);
        const templateTitle = template ? template.title : "this template";

        this.showDeleteConfirmationModal(templateTitle, async () => {
            try {
                this.errorHandler.showLoading("Deleting template...");

                const success = await this.templateManager.deleteTemplate(currentTemplateId);
                if (success) {
                    this.currentMode = "view";
                    this.clearTemplateForm();
                    this.setFormReadOnly(true);
                    this.updateFormButtons();
                    this.formIsDirty = false;
                    // Template manager will emit events and update UI automatically
                }
            } catch (error) {
                console.error("Error deleting template:", error);
                this.errorHandler.showError("Delete Failed", "Failed to delete template. Please try again.");
            } finally {
                this.errorHandler.hideLoading();
            }
        });
    }

    /**
     * Get form data with proper typing
     */
    private getFormData(): TemplateFormData {
        const titleInput = document.getElementById("templateTitleInput") as HTMLInputElement;
        const categorySelect = document.getElementById("templateCategorySelect") as HTMLSelectElement;
        const descriptionInput = document.getElementById("templateDescriptionInput") as HTMLInputElement;
        const contentTextarea = document.getElementById("templateContent") as HTMLTextAreaElement;

        return {
            title: titleInput?.value.trim() || "",
            category: categorySelect?.value || "",
            description: descriptionInput?.value.trim() || "",
            content: contentTextarea?.value || "",
        };
    }

    /**
     * Get current template ID from TemplateManager state
     */
    private getCurrentTemplateId(): string | null {
        const state = this.templateManager.getState();
        return state.selectedTemplateId;
    }

    /**
     * Show unsaved changes modal
     */
    private showUnsavedChangesModal(onConfirm: () => void): void {
        this.showConfirmationModal(
            "Unsaved Changes",
            "You have unsaved changes. Are you sure you want to continue? Your changes will be lost.",
            "Continue",
            "Keep Editing",
            onConfirm
        );
    }

    /**
     * Show delete confirmation modal
     */
    private showDeleteConfirmationModal(templateTitle: string, onConfirm: () => void): void {
        this.showConfirmationModal(
            "Delete Template",
            `Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`,
            "Delete",
            "Cancel",
            onConfirm
        );
    }

    /**
     * Show confirmation modal using the existing modal system
     */
    private showConfirmationModal(title: string, message: string, confirmText: string, cancelText: string, onConfirm: () => void): void {
        const modal = document.getElementById("confirmDialog");
        const titleElement = document.getElementById("confirmTitle");
        const messageElement = document.getElementById("confirmMessage");
        const confirmButton = document.getElementById("confirmYes");
        const cancelButton = document.getElementById("confirmNo");

        if (!modal || !titleElement || !messageElement || !confirmButton || !cancelButton) {
            console.error("Modal elements not found");
            // Fallback to browser confirm
            if (confirm(`${title}\n\n${message}`)) {
                onConfirm();
            }
            return;
        }

        // Set modal content
        titleElement.textContent = title;
        messageElement.textContent = message;
        confirmButton.textContent = confirmText;
        cancelButton.textContent = cancelText;

        // Remove any existing listeners
        const newConfirmButton = confirmButton.cloneNode(true) as HTMLElement;
        const newCancelButton = cancelButton.cloneNode(true) as HTMLElement;
        confirmButton.parentNode?.replaceChild(newConfirmButton, confirmButton);
        cancelButton.parentNode?.replaceChild(newCancelButton, cancelButton);

        // Add new listeners
        newConfirmButton.addEventListener("click", () => {
            this.hideModal();
            onConfirm();
        });

        newCancelButton.addEventListener("click", () => {
            this.hideModal();
        });

        // Show modal
        modal.classList.add("show");
    }

    /**
     * Validate form data
     */
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

    /**
     * Enable/disable action buttons
     */
    private enableActionButtons(enabled: boolean): void {
        const editBtn = document.getElementById("editTemplateBtn") as HTMLButtonElement;
        const deleteBtn = document.getElementById("deleteTemplateBtn") as HTMLButtonElement;

        if (editBtn) editBtn.disabled = !enabled;
        if (deleteBtn) deleteBtn.disabled = !enabled;
    }

    /**
     * Update active template in sidebar
     */
    private updateActiveTemplateInSidebar(templateId: string | null): void {
        const templateItems = document.querySelectorAll(".template-item");
        templateItems.forEach((item) => {
            item.classList.remove("active");
            if (templateId && item.getAttribute("data-template-id") === templateId) {
                item.classList.add("active");
            }
        });
    }

    /**
     * Hide modal
     */
    private hideModal(): void {
        const modal = document.getElementById("confirmDialog");
        if (modal) {
            modal.classList.remove("show");
        }
    }

    /**
     * Utility: Escape HTML
     */
    private escapeHtml(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Utility: Format date
     */
    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
}

// Global app instance
let appInstance: App | null = null;

/**
 * Initialize the application when DOM is ready
 */
async function initializeApp(): Promise<void> {
    if (appInstance) {
        console.warn("App already initialized");
        return;
    }

    try {
        // Create template manager first
        console.log("🏗️ Creating template manager...");
        const templateManager = new TemplateManager();
        // Create app
        console.log("🏗️ Creating application...");
        appInstance = new App(templateManager);
        // Then Initialize manager and app
        console.log("🚀 Initializing template manager...");
        await templateManager.initialize();
        console.log("🚀 Initializing application...");
        await appInstance.initialize();
    } catch (error) {
        console.error("Failed to initialize application:", error);

        // Fallback error display
        const errorDiv = document.createElement("div");
        errorDiv.style.cssText =
            "position:fixed;top:20px;left:20px;right:20px;background:#f87171;color:white;padding:16px;border-radius:8px;z-index:9999;";
        errorDiv.textContent = "Failed to start the application. Please refresh the page and check the console for details.";
        document.body.appendChild(errorDiv);
    }
}

// Start the application when DOM is loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}
