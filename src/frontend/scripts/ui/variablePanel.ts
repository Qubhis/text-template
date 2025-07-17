// src/frontend/scripts/ui/variablePanel.ts

// Variable Panel Component - Handles variable inputs for view mode
// Creates dynamic input fields based on detected variables

import { addEventListenerWithCleanup, getRequiredElement } from "../utils/domHelpers.js";
import { Variable, VariableValues } from "../utils/variableParser.js";

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
     * Create input group for a variable
     */
    private createInputGroup(variable: Variable): HTMLElement {
        const group = document.createElement("div");
        group.className = "variable-input-group";

        // Label
        const label = document.createElement("label");
        label.textContent = variable.name;
        label.className = "variable-label";
        label.setAttribute("for", `var-${variable.name}`);

        // Input element
        let input: HTMLInputElement | HTMLSelectElement;

        if (variable.type === "dropdown" && variable.options) {
            input = this.createDropdownInput(variable);
        } else {
            input = this.createTextInput(variable);
        }

        group.appendChild(label);
        group.appendChild(input);

        return group;
    }

    /**
     * Create text input for basic variables
     */
    private createTextInput(variable: Variable): HTMLInputElement {
        const input = document.createElement("input");
        input.type = "text";
        input.id = `var-${variable.name}`;
        input.className = "variable-input";
        input.placeholder = `Enter ${variable.name}...`;
        input.value = this.currentValues[variable.name] || "";

        // Add event listener for value changes
        const changeCleanup = addEventListenerWithCleanup(input, "input", (e) => {
            const target = e.target as HTMLInputElement;
            this.callbacks.onVariableValueChange?.(variable.name, target.value);
        });
        this.cleanupFunctions.push(changeCleanup);

        return input;
    }

    /**
     * Create dropdown input for choice variables
     */
    private createDropdownInput(variable: Variable): HTMLSelectElement {
        const select = document.createElement("select");
        select.id = `var-${variable.name}`;
        select.className = "variable-select";

        // Add empty option
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = `Select ${variable.name}...`;
        select.appendChild(emptyOption);

        // Add options
        variable.options?.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        // Set current value
        select.value = this.currentValues[variable.name] || "";

        // Add event listener for value changes
        const changeCleanup = addEventListenerWithCleanup(select, "change", (e) => {
            const target = e.target as HTMLSelectElement;
            this.callbacks.onVariableValueChange?.(variable.name, target.value);
        });
        this.cleanupFunctions.push(changeCleanup);

        return select;
    }

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
        emptyMessage.textContent = "No variables detected. Use {{variableName}} in your template.";

        this.variableInputs.appendChild(emptyMessage);
    }

    /**
     * Clear content
     */
    private clearContent(): void {
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
