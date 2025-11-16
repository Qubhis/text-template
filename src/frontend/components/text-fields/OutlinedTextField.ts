// src/frontend/components/text-fields/OutlinedTextField.ts

// Outlined text field component for Material Design 3
// Used in variables panel with text and select modes

import { TextFieldBase, TextFieldOptions, TextFieldCallbacks, TextFieldType } from "./TextFieldBase.js";

export class OutlinedTextField extends TextFieldBase {
    readonly fieldType: TextFieldType;

    constructor(options: TextFieldOptions, callbacks: TextFieldCallbacks = {}) {
        super(options, callbacks);
        this.fieldType = TextFieldType.Outlined;
    }

    protected getBaseClasses(): string {
        let classes = "md-text-field md-text-field--outlined";

        if (this.options.multiline) {
            classes += " md-text-field--multiline";
        }

        if (this.isSelectMode) {
            classes += " md-text-field--select";
        }

        return classes;
    }

    protected addVariantSpecificElements(): void {
        // Outlined text field doesn't need additional elements by default
        // Select mode elements are added when setSelectMode is called from base class
    }
}
