// src/frontend/scripts/main.ts

// Frontend Application Entry Point & Initialization
// Initializes all managers and sets up the application with TemplateEditor coordinator

import DataManager, { StateChangeEvent } from "./core/dataManager.js";
import { isTemplate } from "./core/apiClient.js";
import ErrorHandler from "./core/errorHandler.js";
import { TemplateList } from "./ui/templateList.js";
import { ModalSystem } from "./ui/modalSystem.js";
import { TemplateEditor } from "./ui/templateEditor.js";

/**
 * Application class - main coordinator
 */
class App {
    private dataManager: DataManager;
    private errorHandler: ErrorHandler;
    private templateList: TemplateList;
    private modalSystem: ModalSystem;
    private templateEditor: TemplateEditor; // Single interface to template editing with header integration

    constructor(dataManager: DataManager) {
        this.dataManager = dataManager;
        this.errorHandler = new ErrorHandler(dataManager);

        this.templateList = new TemplateList(dataManager, {
            onTemplateSelect: (templateId: string) => this.selectTemplate(templateId),
            onCreateTemplate: () => this.handleCreateTemplate(),
        });

        this.modalSystem = new ModalSystem();

        // Create template editor coordinator
        this.templateEditor = new TemplateEditor(this.dataManager, {
            onShowUnsavedChangesModal: (onConfirm) => this.modalSystem.showUnsavedChangesModal(onConfirm),
            onShowDeleteConfirmationModal: (templateTitle, onConfirm) => this.modalSystem.showDeleteConfirmationModal(templateTitle, onConfirm),
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
            // Setup data manager event listeners for UI updates
            console.log("🔗 Connecting data manager to UI...");
            this.setupDataManagerListeners();

            console.log("🚀 Initializing data manager...");
            await this.dataManager.initialize();

            // Initialize Template Editor (coordinates header + form)
            console.log("🎨 Initializing template editor...");
            this.templateEditor.initialize();

            // Initialize Template List
            console.log("🎨 Initializing template list...");
            this.templateList.initialize();

            // Initialize Modal System
            console.log("🎨 Initializing modal system...");
            this.modalSystem.initialize();

            console.log("✅ Application UI initialized successfully!");

            // Show success notification
            this.errorHandler.showSuccess("Application Ready", "Text Templates application loaded with new interface!");
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
                console.debug(`Data manager event received: ${eventName}`, data);
                // TemplateEditor handles its own updates, no need to manually update components
            });
        });

        // Template selected - coordinate through TemplateEditor
        this.dataManager.addEventListener("template-selected", (event: string, data: unknown) => {
            if (!isTemplate(data)) {
                console.error("Invalid template data received from data manager:", data);
                return;
            }
            this.templateEditor.loadTemplate(data);
        });

        // Listen to template editor mode changes for app-level updates
        this.templateEditor.addEventListener("mode-changed", (event, data: any) => {
            this.handleModeChange(data.mode);
        });

        console.log("✅ Data manager listeners set up");
    }

    /**
     * Handle mode changes from template editor
     */
    private handleModeChange(mode: "view" | "edit" | "create"): void {
        // Update app-level components based on mode
        this.templateList.setInteractive(mode === "view");

        // Log mode changes for debugging
        console.log(`🎛️ App mode changed to: ${mode}`);
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
        this.templateEditor.startCreate();
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
