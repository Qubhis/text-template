// src/frontend/scripts/ui/templateEditor.ts

// Template Editor Coordinator - Refactored with Centralized State Management
// Single source of truth for all template editing state and data

import EventProvider from "../base/EventProvider.js";
import { Template, CreateTemplateInput, UpdateTemplateInput } from "../core/apiClient.js";
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
 * Complete template data interface
 */
interface TemplateData {
    title: string;
    category: string;
    description: string;
    content: string;
}

/**
 * Template Editor Coordinator - Centralized State Management
 * Components are pure views that communicate via callbacks
 */
export class TemplateEditor extends EventProvider<TemplateEditorEvent> {
    private dataManager: DataManager;
    private callbacks: TemplateEditorCallbacks;
    private templateHeader: TemplateHeader;
    private templateForm: TemplateForm;

    // Centralized state - single source of truth
    private currentMode: "view" | "edit" | "create" = "view";
    private currentTemplate: Template | null = null;
    private currentData: TemplateData = { title: "", category: "", description: "", content: "" };
    private isDirty = false;

    constructor(dataManager: DataManager, callbacks: TemplateEditorCallbacks = {}) {
        super();
        this.dataManager = dataManager;
        this.callbacks = callbacks;

        // Create components as pure views with callbacks
        this.templateHeader = new TemplateHeader({
            onTitleChange: (title) => this.handleDataChange({ title }),
            onCategoryChange: (category) => this.handleDataChange({ category }),
            onSave: () => this.handleSave(),
            onCancel: () => this.handleCancel(),
            onEdit: () => this.handleEdit(),
            onDelete: () => this.handleDelete(),
        });

        this.templateForm = new TemplateForm({
            onDescriptionChange: (description) => this.handleDataChange({ description }),
            onContentChange: (content) => this.handleDataChange({ content }),
        });
    }

    /**
     * Initialize the template editor coordinator
     */
    public initialize(): void {
        // Initialize components
        this.templateHeader.initialize();
        this.templateForm.initialize();

        // Load categories for header dropdown
        this.loadCategories();

        console.log("✅ Template editor coordinator initialized with centralized state");
    }

    /**
     * Load categories for header
     */
    private async loadCategories(): Promise<void> {
        try {
            const categories = this.dataManager.getCategories();
            this.templateHeader.setCategories(categories);
        } catch (error) {
            console.error("Failed to load categories for header:", error);
        }
    }

    /**
     * Load template into editor
     */
    public loadTemplate(template: Template): void {
        if (this.getCurrentMode() !== "view") {
            throw new Error("[BUG] - Cannot load template while not in view mode");
        }
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
     * Set mode for entire editor
     */
    public setMode(mode: "view" | "edit" | "create"): void {
        const previousMode = this.currentMode;
        this.currentMode = mode;

        // Update both components
        this.syncMode();

        // Handle focus for create mode
        if (mode === "create") {
            // Focus title input in header after components update
            setTimeout(() => this.templateHeader.focusTitleInput(), 0);
        }

        this.emit("mode-changed", { mode, previousMode });
        console.log(`🔄 Mode changed from ${previousMode} to: ${mode}`);
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

    // Private methods - State Management

    /**
     * Handle data changes from components
     */
    private handleDataChange(changes: Partial<TemplateData>): void {
        // Update current data
        this.currentData = { ...this.currentData, ...changes };

        // Update dirty state
        this.updateDirtyState();

        console.log(`📝 Data changed:`, changes, `Dirty: ${this.isDirty}`);
    }

    /**
     * Update dirty state based on current vs original data
     */
    private updateDirtyState(): void {
        if (this.currentMode === "view") {
            this.isDirty = false;
            return;
        }

        const originalData = this.getOriginalData();
        const hasChanges =
            this.currentData.title !== originalData.title ||
            this.currentData.category !== originalData.category ||
            this.currentData.description !== originalData.description ||
            this.currentData.content !== originalData.content;

        this.isDirty = hasChanges;
    }

    /**
     * Get original data for comparison
     */
    private getOriginalData(): TemplateData {
        if (this.currentTemplate) {
            return {
                title: this.currentTemplate.title,
                category: this.currentTemplate.category || "",
                description: this.currentTemplate.description || "",
                content: this.currentTemplate.content,
            };
        }
        return { title: "", category: "", description: "", content: "" };
    }

    private syncMode(): void {
        this.templateHeader.setMode(this.currentMode);
        this.templateForm.setMode(this.currentMode);
    }

    private syncData(): void {
        this.templateHeader.updateData(this.currentData, this.currentTemplate?.modified);
        this.templateForm.updateData(this.currentData);
    }

    /**
     * Handle save action from header
     */
    private async handleSave(): Promise<void> {
        try {
            // Validate data
            const validation = this.validateTemplateData(this.currentData);
            if (!validation.isValid) {
                this.callbacks.onShowError?.("Validation Error", validation.errors.join("\n"));
                return;
            }

            this.callbacks.onShowLoading?.("Saving template...");

            let savedTemplate: Template | null = null;

            if (this.currentMode === "create") {
                const createData: CreateTemplateInput = {
                    title: this.currentData.title,
                    content: this.currentData.content,
                    category: this.currentData.category || undefined,
                    description: this.currentData.description || undefined,
                };

                savedTemplate = await this.dataManager.createTemplate(createData);
            } else if (this.currentMode === "edit" && this.currentTemplate) {
                const updateData: UpdateTemplateInput = {
                    title: this.currentData.title,
                    content: this.currentData.content,
                    category: this.currentData.category || undefined,
                    description: this.currentData.description || undefined,
                };

                savedTemplate = await this.dataManager.updateTemplate(this.currentTemplate.id, updateData);
            }

            if (!!savedTemplate) {
                this.currentTemplate = savedTemplate;
                this.currentData = {
                    title: savedTemplate.title,
                    content: savedTemplate.content,
                    category: savedTemplate.category || "",
                    description: savedTemplate.description || "",
                };
                this.setMode("view");
                this.syncData();
                this.isDirty = false;
            }
        } catch (error) {
            console.error("Error saving template:", error);
            this.callbacks.onShowError?.("Save Failed", "Failed to save template. Please try again.");
        } finally {
            this.callbacks.onHideLoading?.();
        }
    }

    /**
     * Handle cancel action from header
     */
    private handleCancel(): void {
        if (this.isDirty) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithCancel();
            });
        } else {
            this.proceedWithCancel();
        }
    }

    private handleEdit(): void {
        this.setMode("edit");
        this.syncData();
    }

    /**
     * Handle delete action from header
     */
    private async handleDelete(): Promise<void> {
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

    // Private methods - Mode Transitions

    private proceedWithTemplateLoad(template: Template): void {
        this.currentTemplate = template;
        this.currentData = {
            title: template.title,
            category: template.category || "",
            description: template.description || "",
            content: template.content,
        };
        this.syncData();
        this.isDirty = false;

        console.log("📄 Template loaded:", template.title);
    }

    private proceedWithClear(): void {
        this.currentTemplate = null;
        this.currentData = { title: "", category: "", description: "", content: "" };
        this.setMode("view");
        this.syncData();
        this.isDirty = false;

        console.log("🧹 Editor cleared");
    }

    private proceedWithCreate(): void {
        this.currentTemplate = null;
        this.currentData = { title: "", category: "", description: "", content: "" };
        this.setMode("create");
        this.syncData();
        this.isDirty = false;

        // Switch to edit tab
        this.callbacks.onSwitchToTab?.("edit");

        console.log("➕ Starting template creation");
    }

    private proceedWithCancel(): void {
        if (this.currentMode === "create") {
            this.proceedWithClear();
        } else if (this.currentMode === "edit") {
            const currentTemplateId = this.currentTemplate?.id;
            this.proceedWithClear();
            // Restore data from dataManager
            if (currentTemplateId) {
                const template = this.dataManager.getTemplate(currentTemplateId);
                if (template) {
                    this.proceedWithTemplateLoad(template);
                }
            }
        }

        console.log("❌ Edit operation cancelled");
    }

    /**
     * Validate complete template data
     */
    private validateTemplateData(data: TemplateData): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.title?.trim()) {
            errors.push("Title is required");
        }

        if (!data.content?.trim()) {
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
     * Cleanup coordinator
     */
    public destroy(): void {
        this.templateHeader.destroy();
        this.templateForm.destroy();
        console.log("🧹 Template editor coordinator destroyed");
    }
}
