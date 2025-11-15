// src/frontend/components/text-fields/FilledTextField.ts

// Filled text field component for Material Design 3
// Used in template header (title) and template form (description, content)

import { TextFieldBase, TextFieldOptions, TextFieldCallbacks, TextFieldType } from "./TextFieldBase.js";

export class FilledTextField extends TextFieldBase {
    readonly fieldType: TextFieldType;
    private activeIndicator!: HTMLElement;

    constructor(options: TextFieldOptions, callbacks: TextFieldCallbacks = {}) {
        super(options, callbacks);
        this.fieldType = TextFieldType.Filled;
    }

    protected getBaseClasses(): string {
        let classes = "md-text-field md-text-field--filled";

        if (this.options.multiline) {
            classes += " md-text-field--multiline";
        }

        if (this.isSelectMode) {
            classes += " md-text-field--select";
        }

        return classes;
    }

    protected addVariantSpecificElements(): void {
        // Create active indicator for filled variant
        this.activeIndicator = document.createElement("div");
        this.activeIndicator.className = "md-text-field__active-indicator";
        this.container.appendChild(this.activeIndicator);
    }
}
