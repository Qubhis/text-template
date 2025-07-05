// src/frontend/scripts/main.ts

// Frontend Application Entry Point & Initialization
// Initializes all managers and sets up the application

// FIXME: no modal is shown when a template is in edit mode and another template is selected from the template list. We should always warn the unsaved changes will be lost if another template is selected
//        it works when a change was made and user clicks cancel or a new template button

// FIXME: initial header load doesn't contain all elements (should be there but hidden) and causes UI inconsistency

// FIXME: Header is not cleared upon template creation or template deletion

import DataManager, { StateChangeEvent } from "./core/dataManager.js";
import { isTemplate, Template } from "./core/apiClient.js";
import ErrorHandler from "./core/errorHandler.js";
import { TemplateList } from "./ui/templateList.js";
import { TabManager } from "./ui/tabManager.js";
import { ModalSystem } from "./ui/modalSystem.js";
import { TemplateForm } from "./ui/templateForm.js";

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
    private dataManager: DataManager;
    private errorHandler: ErrorHandler;
    private templateList: TemplateList;
    private tabManager: TabManager;
    private modalSystem: ModalSystem;
    private templateForm: TemplateForm;

    constructor(dataManager: DataManager) {
        this.dataManager = dataManager;
        this.errorHandler = new ErrorHandler(dataManager);

        this.templateList = new TemplateList(dataManager, {
            onTemplateSelect: (templateId: string) => this.selectTemplate(templateId),
            onCreateTemplate: () => this.templateForm.startCreate(),
        });
        this.tabManager = new TabManager();
        this.modalSystem = new ModalSystem();
        this.templateForm = new TemplateForm(this.dataManager, {
            onModeChange: (mode) => this.templateList.setInteractive(mode === "view"),
            onSwitchToTab: (tabName) => this.tabManager.switchTab(tabName),
            onShowUnsavedChangesModal: (onConfirm) => this.modalSystem.showUnsavedChangesModal(onConfirm),
            onShowError: (title, message) => this.errorHandler.showError(title, message),
            onShowLoading: (message) => this.errorHandler.showLoading(message),
            onHideLoading: () => this.errorHandler.hideLoading(),
        });
    }

    /**
     * Initialize the application UI and event listeners
     */
    async initialize(): Promise<void> {
        try {
            console.log("🚀 Initializing Text Templates App UI...");

            console.log("🚀 Initializing data manager...");
            await this.dataManager.initialize();

            // Setup data manager event listeners for UI updates
            console.log("🔗 Connecting data manager to UI...");
            this.setupDataManagerListeners();

            // Initialize Template List
            console.log("🎨 Initializing template list...");
            this.templateList.initialize();

            // Initialize Tab Manager
            console.log("🎨 Initializing tab manager...");
            this.tabManager.initialize();

            // Initialize Modal System
            console.log("🎨 Initializing modal system...");
            this.modalSystem.initialize();

            // Initialize Template Form
            console.log("🎨 Initializing template form...");
            this.templateForm.initialize();

            // Setup basic UI event listeners
            console.log("🎨 Setting up UI event listeners...");
            this.setupBasicUIListeners();

            // Load initial data and update UI
            console.log("📋 Loading categories...");
            this.loadInitialData();

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
        // Edit template button
        const editBtn = document.getElementById("editTemplateBtn");
        if (editBtn) {
            editBtn.addEventListener("click", () => {
                this.templateForm.startEdit();
            });
        }

        // Delete template button
        const deleteBtn = document.getElementById("deleteTemplateBtn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                this.deleteCurrentTemplate();
            });
        }

        console.log("✅ Basic UI listeners set up");
    }

    /**
     * Setup template manager event listeners for UI updates
     */
    private setupDataManagerListeners(): void {
        // Templates list changes events
        const templateListChangeEvents: StateChangeEvent[] = ["template-created", "template-updated", "template-deleted"];
        templateListChangeEvents.forEach((eventName) => {
            this.dataManager.addEventListener(eventName, (event: string, data: unknown) => {
                console.debug(`Template manager event received: ${eventName}`, data);
                const template: Template | undefined = isTemplate(data) ? data : undefined;
                this.updateSelectedTemplate(template);
            });
        });

        // Template selected - update main content
        this.dataManager.addEventListener("template-selected", (event: string, data: unknown) => {
            if (!isTemplate(data)) {
                console.error("Invalid template data received from data manager:", data);
                return;
            }
            this.handleTemplateSelected(data);
        });

        console.log("✅ Data manager listeners set up");
    }

    /**
     * Load initial data
     */
    private loadInitialData(): void {
        // Load categories for the dropdown
        const categories = this.dataManager.getCategories();
        this.templateForm.updateCategories(categories);
    }

    /**
     * Handle template selection from DataManager
     */
    private handleTemplateSelected(template: Template): void {
        // Check if we have unsaved changes before switching
        if (this.templateForm.getFormDirty() && template?.id !== this.getCurrentTemplateId()) {
            this.modalSystem.showUnsavedChangesModal(() => {
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
            // Just load the template - it will automatically switch to view mode
            this.templateForm.loadTemplate(template);
        } else {
            // Clear form when no template selected - also switches to view mode
            if (this.templateForm.getCurrentMode() !== "create") {
                this.templateForm.clearForm();
            }
        }
    }

    /**
     * Update UI to reflect selected template
     */
    private updateSelectedTemplate(template?: Template): void {
        // Update header
        const titleElement = document.getElementById("templateTitle");
        const categoryElement = document.getElementById("templateCategory");
        const modifiedElement = document.getElementById("templateModified");

        if (template) {
            if (titleElement) titleElement.textContent = template.title;
            if (categoryElement) {
                categoryElement.textContent = template.category || "Uncategorized";
                categoryElement.style.opacity = "100%";
            }
            if (modifiedElement) {
                modifiedElement.textContent = `Modified ${this.formatDate(template.modified)}`;
                modifiedElement.style.opacity = "100%";
            }

            // Enable action buttons
            this.enableActionButtons(true);
        } else {
            if (titleElement) titleElement.textContent = "Select a template";
            if (categoryElement) categoryElement.style.opacity = "0%";
            if (modifiedElement) modifiedElement.style.opacity = "0%";

            // Disable action buttons
            this.enableActionButtons(false);
        }
    }

    /**
     * Select a template
     */
    private selectTemplate(templateId: string): void {
        this.dataManager.selectTemplate(templateId);
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

        const template = this.dataManager.getTemplate(currentTemplateId);
        const templateTitle = template ? template.title : "this template";

        this.modalSystem.showDeleteConfirmationModal(templateTitle, async () => {
            try {
                this.errorHandler.showLoading("Deleting template...");

                const success = await this.dataManager.deleteTemplate(currentTemplateId);
                if (success) {
                    this.templateForm.setMode("view");
                    this.templateForm.clearForm();
                    // Data manager will emit events and update UI automatically
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
     * Get current template ID from TemplateManager state
     */
    private getCurrentTemplateId(): string | null {
        const state = this.dataManager.getState();
        return state.selectedTemplateId;
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
        const dataManager = new DataManager();
        // Create app
        console.log("🏗️ Creating application...");
        appInstance = new App(dataManager);
        // Then initialize the app
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
