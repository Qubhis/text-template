// src/frontend/scripts/ui/variablePanel.ts

// Variable Panel Component - Handles variable inputs for view mode
// Creates dynamic input fields based on detected variables

import { addEventListenerWithCleanup, getRequiredElement } from "../utils/domHelpers.js";
import { Variable, VariableValues } from "../utils/variableParser.js";
import { OutlinedTextField } from "../../components/text-fields/OutlinedTextField.js";

export interface VariablePanelCallbacks {
    onVariableValueChange?: (variableName: string, value: string) => void;
    onResetValues?: () => void;
}

/**
 * Variable Panel Component - View Mode Variable Inputs
 * Generates dynamic input fields for template variables
 */
export class VariablePanel {
    private callbacks: VariablePanelCallbacks;
    private cleanupFunctions: (() => void)[] = [];

    // DOM elements
    private variableInputs: HTMLElement;
    private resetButton: HTMLButtonElement | null = null;

    // Component instances
    private textFieldComponents: Map<string, OutlinedTextField> = new Map();

    // State
    private currentVariables: Variable[] = [];
    private currentValues: VariableValues = {};
    private currentMode: "view" | "edit" | "create" = "view";

    constructor(callbacks: VariablePanelCallbacks = {}) {
        this.callbacks = callbacks;

        // Get required DOM elements
        this.variableInputs = getRequiredElement<HTMLElement>("variableInputs");
    }

    /**
     * Initialize the variable panel component
     */
    public initialize(): void {
        this.showEmptyState();
        console.log("✅ Variable panel initialized");
    }

    /**
     * Set mode for the variable panel
     */
    public setMode(mode: "view" | "edit" | "create"): void {
        this.currentMode = mode;

        if (mode === "view") {
            this.showViewMode();
        } else {
            this.showEditMode();
        }
    }

    /**
     * Update data for the panel (following existing pattern)
     */
    public updateData(variables: Variable[], values: VariableValues = {}): void {
        this.currentVariables = variables;
        this.currentValues = values;

        if (this.currentMode === "view") {
            this.renderVariableInputs();
        } else {
            this.renderDetectedVariables();
        }
    }

    /**
     * Update values in existing text field components (e.g., after reset)
     */
    public updateVariableValues(values: VariableValues): void {
        this.currentValues = values;

        // Update existing OutlinedTextField components
        this.textFieldComponents.forEach((component, variableName) => {
            const newValue = values[variableName] || "";
            component.setValue(newValue);
        });
    }

    // Private methods - View Mode

    /**
     * Show view mode with variable inputs
     */
    private showViewMode(): void {
        if (this.currentVariables.length > 0) {
            this.renderVariableInputs();
        } else {
            this.showEmptyState();
        }
    }

    /**
     * Render variable input fields for view mode
     */
    private renderVariableInputs(): void {
        // Clear existing content
        this.clearContent();

        // Only show valid variables for input generation
        const validVariables = this.currentVariables.filter((v) => v.isValid);

        if (validVariables.length === 0) {
            this.showEmptyState();
            return;
        }

        // Generate input fields for each valid variable
        validVariables.forEach((variable) => {
            const inputGroup = this.createInputGroup(variable);
            this.variableInputs.appendChild(inputGroup);
        });

        // Add reset button
        this.resetButton = this.createResetButton();
        this.variableInputs.appendChild(this.resetButton);
    }

    /**
     * Create input group for a variable using OutlinedTextField
     */
    private createInputGroup(variable: Variable): HTMLElement {
        const group = document.createElement("div");
        group.className = "variable-input-group";

        // Create OutlinedTextField component
        const textField = new OutlinedTextField(
            {
                label: variable.name,
                multiline: true, // Enable multiline for text variables
                maxLines: 3, // Cap at 3 lines with hidden scrollbar
                value: this.currentValues[variable.name] || "",
            },
            {
                onChange: (value: string) => {
                    this.callbacks.onVariableValueChange?.(variable.name, value);
                },
                onOptionSelect: (value: string) => {
                    this.callbacks.onVariableValueChange?.(variable.name, value);
                },
            }
        );

        // Convert to select mode if dropdown type
        if (variable.type === "dropdown" && variable.options) {
            textField.setSelectMode(variable.options);
        }

        // Store component reference for cleanup
        this.textFieldComponents.set(variable.name, textField);

        group.appendChild(textField.getElement());

        return group;
    }

    // Note: createTextInput and createDropdownInput methods have been replaced
    // with OutlinedTextField components in createInputGroup method above.

    /**
     * Create reset button
     */
    private createResetButton(): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "btn btn-secondary btn-small reset-values-btn";
        button.textContent = "Reset Values";
        button.type = "button";

        // Add event listener
        const clickCleanup = addEventListenerWithCleanup(button, "click", () => {
            this.callbacks.onResetValues?.();
        });
        this.cleanupFunctions.push(clickCleanup);

        return button;
    }

    // Private methods - Edit Mode

    /**
     * Show edit mode with detected variables list
     */
    private showEditMode(): void {
        this.renderDetectedVariables();
    }

    /**
     * Render detected variables list for edit mode
     */
    private renderDetectedVariables(): void {
        // Clear existing content
        this.clearContent();

        if (this.currentVariables.length === 0) {
            this.showEmptyState();
            return;
        }

        // Separate valid and invalid variables
        const validVariables = this.currentVariables.filter((v) => v.isValid);
        const invalidVariables = this.currentVariables.filter((v) => !v.isValid);

        // Create container for detected variables
        const detectedContainer = document.createElement("div");
        detectedContainer.className = "detected-variables-container";

        // Add header with counts
        const header = document.createElement("div");
        header.className = "detected-variables-header";
        header.textContent = `Detected Variables (${validVariables.length} valid, ${invalidVariables.length} invalid)`;
        detectedContainer.appendChild(header);

        // Add valid variables section
        if (validVariables.length > 0) {
            const validSection = this.createVariableSection("Valid Variables", validVariables, "valid");
            detectedContainer.appendChild(validSection);
        }

        // Add invalid variables section
        if (invalidVariables.length > 0) {
            const invalidSection = this.createVariableSection("Invalid Variables", invalidVariables, "invalid");
            detectedContainer.appendChild(invalidSection);
        }

        this.variableInputs.appendChild(detectedContainer);
    }

    /**
     * Create a section for variables (valid or invalid)
     */
    private createVariableSection(title: string, variables: Variable[], type: "valid" | "invalid"): HTMLElement {
        const section = document.createElement("div");
        section.className = `variable-section ${type}`;

        // Section header
        const sectionHeader = document.createElement("div");
        sectionHeader.className = "variable-section-header";
        sectionHeader.textContent = title;
        section.appendChild(sectionHeader);

        // Variable list
        const variableList = document.createElement("div");
        variableList.className = "detected-variables-list";

        variables.forEach((variable) => {
            const variableItem = document.createElement("div");
            variableItem.className = `detected-variable-item ${type}`;

            const name = document.createElement("span");
            name.className = "variable-name";
            name.textContent = variable.name;

            const typeSpan = document.createElement("span");
            typeSpan.className = "variable-type";
            typeSpan.textContent = variable.type;

            variableItem.appendChild(name);
            variableItem.appendChild(typeSpan);

            // Add options for dropdown variables
            if (variable.type === "dropdown" && variable.options) {
                const options = document.createElement("span");
                options.className = "variable-options";
                options.textContent = `[${variable.options.join(", ")}]`;
                variableItem.appendChild(options);
            }

            // Add error message for invalid variables
            if (!variable.isValid && variable.errorMessage) {
                const errorMsg = document.createElement("span");
                errorMsg.className = "variable-error";
                errorMsg.textContent = variable.errorMessage;
                variableItem.appendChild(errorMsg);
            }

            variableList.appendChild(variableItem);
        });

        section.appendChild(variableList);
        return section;
    }

    // Private methods - Common

    /**
     * Show empty state
     */
    private showEmptyState(): void {
        this.clearContent();

        const emptyMessage = document.createElement("p");
        emptyMessage.className = "no-variables";
        emptyMessage.textContent =
            "No variables detected. Type {{variableName}} for a single text input variable or type {{dropdown:option one|option two}} for a dropdown input variable with options separated by the pipe operator ( | ).";

        this.variableInputs.appendChild(emptyMessage);
    }

    /**
     * Clear content and cleanup OutlinedTextField components
     */
    private clearContent(): void {
        // Destroy all OutlinedTextField components
        this.textFieldComponents.forEach((component) => component.destroy());
        this.textFieldComponents.clear();

        this.variableInputs.innerHTML = "";
        this.resetButton = null;
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        this.clearContent();

        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];

        console.log("🧹 Variable panel destroyed");
    }
}
