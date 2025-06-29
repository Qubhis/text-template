// src/frontend/scripts/main.ts
// Frontend Application Entry Point & Initialization
// Initializes all managers and sets up the application

import { isTemplate, Template } from "./apiClient.js";
import { getTemplateManager, isSearchChangedEventParameters, TemplateManager } from "./templateManager.js";
import UIErrorHandler from "./uiErrorHandler.js";

/**
 * Application class - main coordinator
 */
class App {
    private templateManager: TemplateManager;
    private errorHandler: UIErrorHandler;
    private isInitialized = false;

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
            await this.loadInitialData();

            this.isInitialized = true;
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

        // Template selected - update main content
        this.templateManager.addEventListener("template-selected", (event: string, data: unknown) => {
            if (!isTemplate(data)) {
                console.error("Invalid template data received from template manager:", data);
                return;
            }
            this.updateSelectedTemplate(data);
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
    private async loadInitialData(): Promise<void> {
        // Template manager will automatically load templates during initialization
        // We just need to update the UI with the current state
        const state = this.templateManager.getState();
        this.updateTemplateList(state.filteredTemplates);

        // Load categories for the dropdown
        const categories = this.templateManager.getCategories();
        this.updateCategoriesDropdown(categories);
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
     * Update selected template in main content
     */
    private updateSelectedTemplate(template: any): void {
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
        // Clear the form
        this.clearTemplateForm();

        // Switch to edit tab
        this.switchTab("edit");

        // Focus on title input
        const titleInput = document.getElementById("templateTitleInput") as HTMLInputElement;
        if (titleInput) {
            titleInput.focus();
        }

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
        // Initialize template manager first
        console.log("📊 Initializing template manager...");
        const templateManager = await getTemplateManager();

        // Create and initialize app
        console.log("🏗️ Creating application...");
        appInstance = new App(templateManager);
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
