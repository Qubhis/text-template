// src/frontend/scripts/main.ts

// Frontend Application Entry Point & Initialization
// Initializes all managers and sets up the application

import DataManager, { StateChangeEvent } from "./core/dataManager.js";
import { isTemplate, Template } from "./core/apiClient.js";
import ErrorHandler from "./core/errorHandler.js";
import { TemplateList } from "./ui/templateList.js";
import { TabManager } from "./ui/tabManager.js";
import { ModalSystem } from "./ui/modalSystem.js";
import { TemplateForm } from "./ui/templateForm.js";
import { TemplateHeader } from "./ui/templateHeader.js";

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
    private templateHeader: TemplateHeader;

    constructor(dataManager: DataManager) {
        this.dataManager = dataManager;
        this.errorHandler = new ErrorHandler(dataManager);

        this.templateList = new TemplateList(dataManager, {
            onTemplateSelect: (templateId: string) => this.selectTemplate(templateId),
            onCreateTemplate: () => this.handleCreateTemplate(),
        });
        this.tabManager = new TabManager();
        this.modalSystem = new ModalSystem();
        this.templateForm = new TemplateForm(this.dataManager, {
            onModeChange: (mode) => {
                this.templateList.setInteractive(mode === "view");
                this.templateHeader.enableEditButton(mode === "view");
            },
            onSwitchToTab: (tabName) => this.tabManager.switchTab(tabName),
            onShowUnsavedChangesModal: (onConfirm) => this.modalSystem.showUnsavedChangesModal(onConfirm),
            onShowError: (title, message) => this.errorHandler.showError(title, message),
            onShowLoading: (message) => this.errorHandler.showLoading(message),
            onHideLoading: () => this.errorHandler.hideLoading(),
        });
        this.templateHeader = new TemplateHeader({
            onEditTemplate: () => this.templateForm.startEdit(),
            onDeleteTemplate: () => this.deleteCurrentTemplate(),
        });
    }

    /**
     * Initialize the application UI and event listeners
     */
    async initialize(): Promise<void> {
        try {
            // Setup data manager event listeners for UI updates
            console.log("🔗 Connecting data manager to UI...");
            this.setupDataManagerListeners();

            console.log("🚀 Initializing data manager...");
            await this.dataManager.initialize();

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

            // Initialize Template Header
            console.log("🎨 Initializing template header...");
            this.templateHeader.initialize();

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
     * Setup template manager event listeners for UI updates
     */
    private setupDataManagerListeners(): void {
        // Templates list changes events
        const templateListChangeEvents: StateChangeEvent[] = ["template-created", "template-updated", "template-deleted"];
        templateListChangeEvents.forEach((eventName) => {
            this.dataManager.addEventListener(eventName, (event: string, data: unknown) => {
                console.debug(`Template manager event received: ${eventName}`, data);
                const template: Template | undefined = isTemplate(data) ? data : undefined;
                this.templateHeader.updateHeader(template);
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

        this.templateForm.addEventListener("create-cancelled", (event: string) => this.templateHeader.enableEditButton(false));

        console.log("✅ Data manager listeners set up");
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
        this.templateHeader.updateHeader(template);

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
     * Select a template
     */
    private selectTemplate(templateId: string): void {
        this.dataManager.selectTemplate(templateId);
    }

    /**
     * Handle create template button press
     */
    private handleCreateTemplate(): void {
        this.templateHeader.updateHeader(); // clear header
        this.templateForm.startCreate();
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
