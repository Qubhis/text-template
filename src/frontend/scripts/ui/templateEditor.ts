// src/frontend/scripts/ui/templateEditor.ts

// Template Editor Coordinator - Refactored with Centralized State Management
// Single source of truth for all template editing state and data

import EventProvider from "../base/EventProvider.js";
import { Template, CreateTemplateInput, UpdateTemplateInput } from "../core/apiClient.js";
import DataManager from "../core/dataManager.js";
import { TemplateHeader } from "./editor/templateHeader.js";
import { TemplateForm } from "./editor/templateForm.js";
import { VariablePanel } from "./variablePanel.js";
import VariableParser, { VariableValues } from "../utils/variableParser.js";

export interface TemplateEditorCallbacks {
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
    categoryId: string;
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
    private variablePanel: VariablePanel;

    // Centralized state - single source of truth
    private currentMode: "view" | "edit" | "create" = "view";
    private currentTemplate: Template | null = null;
    private currentData: TemplateData = { title: "", categoryId: "", description: "", content: "" };
    private isDirty = false;

    // Variable state management - per template during session
    private variableValues: VariableValues = {};

    constructor(dataManager: DataManager, callbacks: TemplateEditorCallbacks = {}) {
        super();
        this.dataManager = dataManager;
        this.callbacks = callbacks;

        // Create components as pure views with callbacks
        this.templateHeader = new TemplateHeader({
            onTitleChange: (title) => this.handleDataChange({ title }),
            onCategoryChange: (category) => this.handleDataChange({ categoryId: category }),
            onSave: () => this.handleSave(),
            onCancel: () => this.handleCancel(),
            onEdit: () => this.handleEdit(),
            onDelete: () => this.handleDelete(),
        });

        this.templateForm = new TemplateForm({
            onDescriptionChange: (description) => this.handleDataChange({ description }),
            onContentChange: (content) => this.handleDataChange({ content }),
            getVariableValues: () => this.getVariableValues(),
        });

        this.variablePanel = new VariablePanel({
            onVariableValueChange: (variableName, value) => this.handleVariableChange(variableName, value),
            onResetValues: () => this.handleResetValues(),
        });
    }

    /**
     * Initialize the template editor coordinator
     */
    public initialize(): void {
        // Initialize components
        this.templateHeader.initialize();
        this.templateForm.initialize();
        this.variablePanel.initialize();

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
        if (this.isDirtyState()) {
            this.callbacks.onShowUnsavedChangesModal?.(() => {
                this.proceedWithTemplateLoad(template);
            });
        } else {
            this.proceedWithTemplateLoad(template);
        }
    }

    /**
     * Start creating new template
     */
    public startCreate(): void {
        if (this.isDirtyState()) {
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

    /**
     * Get current variable values for the selected template
     */
    public getVariableValues(): VariableValues {
        return { ...this.variableValues };
    }

    /**
     * Set variable value for the current template
     */
    public setVariableValue(variableName: string, value: string): void {
        this.variableValues[variableName] = value;
    }

    /**
     * Reset all variable values for the current template
     */
    public resetVariableValues(): void {
        this.variableValues = {};
    }

    /**
     * Get processed template content with current variable values
     */
    public getProcessedTemplate(): string {
        if (!this.currentTemplate) {
            return "";
        }

        const processResult = VariableParser.processTemplate(this.currentTemplate.content, this.variableValues);
        return processResult.content;
    }

    /**
     * Get current variables parsed from template content
     */
    public getCurrentVariables() {
        if (!this.currentTemplate) {
            return [];
        }

        const parseResult = VariableParser.parseVariables(this.currentTemplate.content);
        return parseResult.variables; // Return ALL variables (valid and invalid)
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

        // If content changed, update Variables panel to show detected variables in real-time
        if (changes.content !== undefined) {
            this.updateVariablePanelFromCurrentData();
        }

        console.log(`📝 Data changed:`, changes, `Dirty: ${this.isDirty}`);
    }

    /**
     * Update Variables panel from current content data (for real-time detection during editing)
     */
    private updateVariablePanelFromCurrentData(): void {
        if (this.currentData.content) {
            const parseResult = VariableParser.parseVariables(this.currentData.content);
            this.variablePanel.updateData(parseResult.variables, this.variableValues);
        } else {
            this.variablePanel.updateData([], this.variableValues);
        }
    }

    /**
     * Handle variable value changes from variable panel
     */
    private handleVariableChange(variableName: string, value: string): void {
        this.setVariableValue(variableName, value);
        // Refresh the form display to show updated variable highlighting
        this.templateForm.updateData(this.currentData);
    }

    /**
     * Handle reset values from variable panel
     */
    private handleResetValues(): void {
        this.resetVariableValues();
        // Refresh both variable panel and form display
        this.syncData();
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
            this.currentData.categoryId !== originalData.categoryId ||
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
                categoryId: this.currentTemplate.categoryId || "",
                description: this.currentTemplate.description || "",
                content: this.currentTemplate.content,
            };
        }
        return { title: "", categoryId: "", description: "", content: "" };
    }

    private syncMode(): void {
        this.templateHeader.setMode(this.currentMode);
        this.templateForm.setMode(this.currentMode);
        this.variablePanel.setMode(this.currentMode);
    }

    private syncData(): void {
        this.templateHeader.updateData(this.currentData, this.currentTemplate?.modified);
        this.templateForm.updateData(this.currentData);
        this.variablePanel.updateData(this.getCurrentVariables(), this.variableValues);
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
                    categoryId: this.currentData.categoryId || undefined,
                    description: this.currentData.description || undefined,
                };

                savedTemplate = await this.dataManager.createTemplate(createData);
            } else if (this.currentMode === "edit" && this.currentTemplate) {
                const updateData: UpdateTemplateInput = {
                    title: this.currentData.title,
                    content: this.currentData.content,
                    categoryId: this.currentData.categoryId || undefined,
                    description: this.currentData.description || undefined,
                };

                savedTemplate = await this.dataManager.updateTemplate(this.currentTemplate.id, updateData);
            }

            if (!!savedTemplate) {
                this.currentTemplate = savedTemplate;
                this.currentData = {
                    title: savedTemplate.title,
                    content: savedTemplate.content,
                    categoryId: savedTemplate.categoryId || "",
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
        if (this.isDirtyState()) {
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
            categoryId: template.categoryId || "",
            description: template.description || "",
            content: template.content,
        };
        // Clear variable values when switching templates
        this.resetVariableValues();
        this.syncData();
        this.isDirty = false;

        console.log("📄 Template loaded:", template.title);
    }

    private proceedWithClear(): void {
        this.currentTemplate = null;
        this.currentData = { title: "", categoryId: "", description: "", content: "" };
        this.resetVariableValues();
        this.setMode("view");
        this.syncData();
        this.isDirty = false;

        console.log("🧹 Editor cleared");
    }

    private proceedWithCreate(): void {
        this.currentTemplate = null;
        this.currentData = { title: "", categoryId: "", description: "", content: "" };
        this.resetVariableValues();
        this.setMode("create");
        this.syncData();
        this.isDirty = false;

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

        if (!data.categoryId) {
            errors.push("Category is required");
        }

        if (data.description && data.description.length > 500) {
            errors.push("Description cannot exceed 500 characters");
        }

        // Validate template variables
        if (data.content?.trim()) {
            const parseResult = VariableParser.parseVariables(data.content);
            const invalidVariables = parseResult.variables.filter((v) => !v.isValid);

            if (invalidVariables.length > 0) {
                errors.push("Template contains invalid variables:");
                invalidVariables.forEach((variable) => {
                    const errorMsg = variable.errorMessage || `Invalid variable: ${variable.name}`;
                    errors.push(`  • ${errorMsg}`);
                });
            }
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
        this.variablePanel.destroy();
        console.log("🧹 Template editor coordinator destroyed");
    }
}
