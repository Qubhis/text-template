// src/frontend/scripts/ui/templateEditor.ts

// Template Editor Coordinator
// Coordinates templateHeader and templateForm, acts as single interface for main.ts

import EventProvider from "../base/EventProvider.js";
import { Template } from "../core/apiClient.js";
import DataManager from "../core/dataManager.js";
import { TemplateHeader } from "./editor/templateHeader.js";
import { TemplateForm } from "./editor/templateForm.js";

export interface TemplateEditorCallbacks {
    onSwitchToTab?: (tabName: string) => void;
    onShowUnsavedChangesModal?: (onConfirm: () => void) => void;
    onShowDeleteConfirmationModal?: (templateTitle: string, onConfirm: () => void) => void;
    onShowError?: (title: string, message: string) => void;
    onShowLoading?: (message: string) => void;
    onHideLoading?: () => void;
}

export type TemplateEditorEvent = "mode-changed";

/**
 * Template Editor Coordinator
 * Single interface that manages both header and form components
 */
export class TemplateEditor extends EventProvider<TemplateEditorEvent> {
    private dataManager: DataManager;
    private callbacks: TemplateEditorCallbacks;
    private templateHeader: TemplateHeader;
    private templateForm: TemplateForm;

    // Shared state
    private currentMode: "view" | "edit" | "create" = "view";
    private isDirty = false;
    private currentTemplate: Template | null = null;

    constructor(dataManager: DataManager, callbacks: TemplateEditorCallbacks = {}) {
        super();
        this.dataManager = dataManager;
        this.callbacks = callbacks;

        this.templateHeader = new TemplateHeader({
            onEditTemplate: () => this.startEdit(),
            onDeleteTemplate: () => this.deleteCurrentTemplate(),
        });
        this.templateForm = new TemplateForm(dataManager, {
            onFormDirtyChange: (isDirty) => this.setDirty(isDirty),
            onModeChange: (mode) => this.setMode(mode),
            onShowUnsavedChangesModal: (onConfirm) => this.callbacks.onShowUnsavedChangesModal?.(onConfirm),
            onShowError: (title, message) => this.callbacks.onShowError?.(title, message),
            onShowLoading: (message) => this.callbacks.onShowLoading?.(message),
            onHideLoading: () => this.callbacks.onHideLoading?.(),
        });
    }

    /**
     * Initialize the template editor coordinator
     */
    public initialize(): void {
        // Initialize both components with their existing constructors
        // Header and Form were already configured with callbacks in main.ts
        this.templateHeader.initialize();
        this.templateForm.initialize();

        console.log("✅ Template editor coordinator initialized");
    }

    /**
     * Load template into editor
     */
    public loadTemplate(template: Template): void {
        if (this.isDirty) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithTemplateLoad(template);
            });
        } else {
            this.proceedWithTemplateLoad(template);
        }
    }

    /**
     * Clear editor (no template selected)
     */
    public clearEditor(): void {
        if (this.isDirty) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithClear();
            });
        } else {
            this.proceedWithClear();
        }
    }

    /**
     * Start creating new template
     */
    public startCreate(): void {
        if (this.isDirty) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithCreate();
            });
        } else {
            this.proceedWithCreate();
        }
    }

    /**
     * Get current editor mode
     */
    public getCurrentMode(): "view" | "edit" | "create" {
        return this.currentMode;
    }

    /**
     * Check if editor has unsaved changes
     */
    public isDirtyState(): boolean {
        return this.isDirty;
    }

    /**
     * Get current template
     */
    public getCurrentTemplate(): Template | null {
        return this.currentTemplate;
    }

    /**
     * Set dirty state externally
     */
    public setDirty(dirty: boolean): void {
        if (this.isDirty !== dirty) {
            this.isDirty = dirty;
            console.log(`💾 Dirty state: ${dirty}`);
        }
    }

    // Private coordination methods

    private proceedWithTemplateLoad(template: Template): void {
        this.currentTemplate = template;
        this.setMode("view");
        this.setDirty(false);

        // Update both components
        this.templateHeader.updateHeader(template);
        this.templateForm.loadTemplate(template);

        console.log("📄 Template loaded:", template.title);
    }

    private proceedWithClear(): void {
        this.currentTemplate = null;
        this.setMode("view");
        this.setDirty(false);

        // Clear both components
        this.templateHeader.updateHeader();
        this.templateForm.clearForm();

        console.log("🧹 Editor cleared");
    }

    private proceedWithCreate(): void {
        this.currentTemplate = null;
        this.setMode("create");
        this.setDirty(false);

        // Clear header and start form creation
        this.templateHeader.updateHeader(); // Empty state
        this.templateForm.startCreate();

        console.log("➕ Starting template creation");
    }

    /**
     * Start editing current template (public interface)
     */
    public startEdit(): void {
        if (!this.currentTemplate) {
            this.callbacks.onShowError?.("No Template Selected", "Please select a template to edit.");
            return;
        }

        this.setMode("edit");
        this.templateForm.startEdit();

        console.log("✏️ Starting template edit:", this.currentTemplate.title);
    }

    private async deleteCurrentTemplate(): Promise<void> {
        if (!this.currentTemplate) {
            this.callbacks.onShowError?.("No Template Selected", "Please select a template to delete.");
            return;
        }

        this.callbacks.onShowDeleteConfirmationModal?.(this.currentTemplate.title, async () => {
            try {
                this.callbacks.onShowLoading?.("Deleting template...");

                const success = await this.dataManager.deleteTemplate(this.currentTemplate!.id);
                if (success) {
                    this.proceedWithClear();
                }
            } catch (error) {
                console.error("Error deleting template:", error);
                this.callbacks.onShowError?.("Delete Failed", "Failed to delete template. Please try again.");
            } finally {
                this.callbacks.onHideLoading?.();
            }
        });
    }

    /**
     * Set the current mode (called by form when mode changes)
     */
    public setMode(mode: "view" | "edit" | "create"): void {
        if (this.currentMode !== mode) {
            this.currentMode = mode;

            // Update header state based on mode
            this.templateHeader.enableEditButton(mode === "view");

            this.emit("mode-changed", { mode });
            console.log(`🔄 Mode changed to: ${mode}`);
        }
    }

    /**
     * Cleanup coordinator
     */
    public destroy(): void {
        this.templateHeader.destroy();
        this.templateForm.destroy();
        console.log("🧹 Template editor coordinator destroyed");
    }
}
