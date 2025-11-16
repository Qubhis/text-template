// src/frontend/components/text-fields/TextFieldBase.ts

// Base class for Material Design 3 text fields
// Provides core functionality for both filled and outlined variants

export interface TextFieldOptions {
    label: string;
    isRequired?: boolean;
    multiline?: boolean;
    maxLines?: number; // For outlined fields with hidden scrollbar
    stretchHeight?: boolean; // For filled content field
    value?: string;
    maxLength?: number; // Character limit for the input
}

export interface TextFieldCallbacks {
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onOptionSelect?: (value: string) => void;
}

export enum TextFieldType {
    Filled = "Filled",
    Outlined = "Outlined",
}

// Simple dropdown arrow SVG
export const DROPDOWN_ARROW_SVG = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M7 10l5 5 5-5z"/>
</svg>
`;

export abstract class TextFieldBase {
    private readonly defaultMaxLines = 10;

    readonly fieldType!: TextFieldType;

    protected element!: HTMLElement;
    protected container!: HTMLElement;
    protected input!: HTMLInputElement | HTMLTextAreaElement;
    protected label!: HTMLElement;
    protected supportingTextContainer!: HTMLElement;
    protected supportingTextLeft!: HTMLElement;
    protected supportingTextRight!: HTMLElement;

    protected options: TextFieldOptions;
    protected callbacks: TextFieldCallbacks;
    protected currentValue: string = "";
    protected errorMessage: string | null = null;
    protected isFocused: boolean = false;
    protected isHovered: boolean = false;

    // Select mode properties
    protected isSelectMode: boolean = false;
    protected selectOptions: string[] = [];
    protected dropdownIcon: HTMLElement | null = null;
    protected dropdown: HTMLElement | null = null;
    protected isDropdownOpen: boolean = false;
    protected selectedIndex: number = -1;

    constructor(options: TextFieldOptions, callbacks: TextFieldCallbacks = {}) {
        this.options = options;
        this.callbacks = callbacks;
        this.currentValue = options.value || "";

        if (this.options.multiline) {
            this.options.maxLines ??= this.defaultMaxLines;
        }

        this.createElement();
        this.setupEventListeners();
        this.updateState();
    }

    private createElement(): void {
        // Create main container
        this.element = document.createElement("div");
        this.element.className = this.getBaseClasses();

        // Create field container
        this.container = document.createElement("div");
        this.container.className = "md-text-field__container";

        // Create input element
        if (this.options.multiline) {
            this.input = document.createElement("textarea");
            this.input.setAttribute("rows", "1");
            if (this.options.maxLines) {
                this.element.classList.add("md-text-field--max-lines");
            }
        } else {
            this.input = document.createElement("input");
            this.input.type = "text";
        }

        // Apply special styling
        if (this.options.stretchHeight) {
            this.element.classList.add("md-text-field--stretch");
        }

        this.input.className = "md-text-field__input";
        this.input.value = this.currentValue;

        if (this.options.maxLength) {
            this.input.setAttribute("maxlength", this.options.maxLength.toString());
        }

        // Create label
        this.label = document.createElement("label");
        this.label.className = "md-text-field__label";
        this.label.textContent = `${this.options.label}${(this.options.isRequired ?? false) ? "*" : ""}`;
        const isRequiredField = this.options.isRequired ?? false;

        // Create supporting text container with left and right sections
        this.supportingTextContainer = document.createElement("div");
        this.supportingTextContainer.className = "md-text-field__supporting-text";
        this.supportingTextContainer.style.display = "flex";
        this.supportingTextContainer.style.justifyContent = "space-between";
        this.supportingTextContainer.style.visibility = "hidden"; // Reserve space but hide initially

        this.supportingTextLeft = document.createElement("div");
        this.supportingTextLeft.style.flex = "1";
        if (isRequiredField) {
            this.supportingTextLeft.textContent = "*required";
            this.supportingTextContainer.style.visibility = "visible";
        }

        this.supportingTextRight = document.createElement("div");
        this.supportingTextRight.style.flexShrink = "0";

        this.supportingTextContainer.appendChild(this.supportingTextLeft);
        this.supportingTextContainer.appendChild(this.supportingTextRight);

        // Assemble DOM
        this.container.appendChild(this.input);
        this.container.appendChild(this.label);
        this.addVariantSpecificElements();

        this.element.appendChild(this.container);
        this.element.appendChild(this.supportingTextContainer);

        // Initial auto-resize for pre-existing content
        setTimeout(() => this.autoResizeTextarea(), 0);
    }

    private setupEventListeners(): void {
        // Input events
        this.input.addEventListener("input", () => {
            const trimmedValue = this.input.value.trimStart();
            this.input.value = trimmedValue;
            this.currentValue = trimmedValue;
            this.clearError(); // Auto-clear error on input
            this.autoResizeTextarea();
            this.updateState();
            this.callbacks.onChange?.(this.currentValue);
        });

        this.input.addEventListener("focus", () => {
            this.isFocused = true;
            this.updateState();
            this.callbacks.onFocus?.();
        });

        this.input.addEventListener("blur", () => {
            this.isFocused = false;
            this.updateState();
            this.callbacks.onBlur?.();
        });

        // Hover events
        this.element.addEventListener("mouseenter", () => {
            this.isHovered = true;
            this.updateState();
        });

        this.element.addEventListener("mouseleave", () => {
            this.isHovered = false;
            this.updateState();
        });
    }

    private updateState(): void {
        const isPopulated = this.currentValue.length > 0;
        const hasError = this.errorMessage !== null;
        const shouldShowCharCount = this.options.maxLength && isPopulated;
        const isRequired = this.options.isRequired ?? false;

        // Update classes
        this.element.classList.toggle("md-text-field--populated", isPopulated);
        this.element.classList.toggle("md-text-field--focused", this.isFocused);
        this.element.classList.toggle("md-text-field--hovered", this.isHovered);
        this.element.classList.toggle("md-text-field--error", hasError);

        // Update supporting text - both error and character count can display simultaneously
        const shouldShowContainer = hasError || shouldShowCharCount || isRequired;

        // Always reserve space for supporting text, but control visibility
        this.supportingTextContainer.style.visibility = shouldShowContainer ? "visible" : "hidden";

        // Left side: error message or default supporting text
        this.supportingTextLeft.textContent = hasError ? this.errorMessage! : isRequired ? "*required" : "";

        // Right side: character count or empty
        if (shouldShowCharCount) {
            const charCount = `${this.currentValue.length} / ${this.options.maxLength}`;
            this.supportingTextRight.textContent = charCount;
        } else {
            this.supportingTextRight.textContent = "";
        }
    }

    // Abstract method for variant-specific elements
    protected abstract addVariantSpecificElements(): void;

    // Abstract method for base classes
    protected abstract getBaseClasses(): string;

    // Public API
    public getValue(): string {
        return this.currentValue;
    }

    public setValue(value: string): void {
        this.currentValue = value;
        this.input.value = value;
        this.autoResizeTextarea();
        this.updateState();

        if (this.isSelectMode) {
            this.populateDropdown();
        }
    }

    public setError(message: string | null): void {
        this.errorMessage = message;
        this.updateState();
    }

    public clearError(): void {
        this.setError(null);
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public focus(): void {
        this.input.focus();
    }

    public destroy(): void {
        this.element.remove();
    }

    // Convert to select mode with dropdown
    public setSelectMode(options: string[]): void {
        if (this.isSelectMode) {
            return; // Already in select mode
        }

        this.isSelectMode = true;
        this.selectOptions = options;

        // Update classes
        this.element.classList.add("md-text-field--select");

        // Make input readonly and add click handler
        this.input.readOnly = true;
        this.input.style.cursor = "pointer";

        // Add dropdown icon
        this.dropdownIcon = document.createElement("div");
        this.dropdownIcon.className = "md-text-field__icon md-text-field__dropdown-icon";
        this.dropdownIcon.innerHTML = DROPDOWN_ARROW_SVG;
        this.container.appendChild(this.dropdownIcon);

        // Create dropdown
        this.dropdown = document.createElement("div");
        this.dropdown.className = "md-text-field__dropdown";
        this.populateDropdown();
        this.element.appendChild(this.dropdown);

        // Add select-specific event listeners
        this.setupSelectEventListeners();
    }

    private populateDropdown(): void {
        if (!this.dropdown) return;

        this.dropdown.innerHTML = "";

        this.selectOptions.forEach((option, index) => {
            const optionElement = document.createElement("div");
            optionElement.className = "md-text-field__dropdown-option";
            optionElement.textContent = option;

            if (option === this.currentValue) {
                optionElement.classList.add("md-text-field__dropdown-option--selected");
            }

            if (index === this.selectedIndex) {
                optionElement.classList.add("md-text-field__dropdown-option--highlighted");
            }

            optionElement.addEventListener("click", () => {
                this.selectOption(option);
            });

            this.dropdown!.appendChild(optionElement);
        });
    }

    private setupSelectEventListeners(): void {
        // Handle clicks to open/close dropdown
        const clickHandler = (e: Event) => {
            e.stopPropagation();
            this.toggleDropdown();
        };

        this.input.addEventListener("click", clickHandler);
        this.dropdownIcon?.addEventListener("click", clickHandler);

        // Close dropdown when clicking outside
        document.addEventListener("click", (e: Event) => {
            if (!this.element.contains(e.target as Node)) {
                this.closeDropdown();
            }
        });

        // Handle keyboard navigation and form submission prevention
        this.input.addEventListener("keydown", (e: Event) => {
            const keyEvent = e as KeyboardEvent;

            // Always prevent Enter key form submission for input-type fields
            if (keyEvent.key === "Enter" && this.input.tagName === "INPUT") {
                keyEvent.preventDefault();
                // In select mode, Enter should select the highlighted option
                if (this.isSelectMode && this.isDropdownOpen && this.selectedIndex >= 0) {
                    this.selectOptionByIndex(this.selectedIndex);
                }
                return;
            }

            // Handle dropdown navigation only in select mode
            if (this.isSelectMode) {
                switch (keyEvent.key) {
                    case "ArrowDown":
                        keyEvent.preventDefault();
                        if (!this.isDropdownOpen) {
                            this.openDropdown();
                        } else {
                            this.navigateDropdown(1);
                        }
                        break;
                    case "ArrowUp":
                        keyEvent.preventDefault();
                        if (this.isDropdownOpen) {
                            this.navigateDropdown(-1);
                        }
                        break;
                    case "Escape":
                        keyEvent.preventDefault();
                        this.closeDropdown();
                        break;
                }
            }
        });
    }

    private toggleDropdown(): void {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    private openDropdown(): void {
        if (!this.dropdown || this.isDropdownOpen) return;

        this.isDropdownOpen = true;
        this.element.classList.add("md-text-field--opened");

        // Set initial selection to current value if exists
        const currentIndex = this.selectOptions.indexOf(this.currentValue);
        this.selectedIndex = currentIndex >= 0 ? currentIndex : 0;
        this.populateDropdown();
    }

    private closeDropdown(): void {
        if (!this.dropdown || !this.isDropdownOpen) return;

        this.isDropdownOpen = false;
        this.element.classList.remove("md-text-field--opened");
        this.selectedIndex = -1;
    }

    private navigateDropdown(direction: number): void {
        if (!this.isDropdownOpen || this.selectOptions.length === 0) return;

        this.selectedIndex += direction;

        // Wrap around
        if (this.selectedIndex < 0) {
            this.selectedIndex = this.selectOptions.length - 1;
        } else if (this.selectedIndex >= this.selectOptions.length) {
            this.selectedIndex = 0;
        }

        this.populateDropdown();
    }

    private selectOptionByIndex(index: number): void {
        if (index >= 0 && index < this.selectOptions.length) {
            this.selectOption(this.selectOptions[index]);
        }
    }

    private selectOption(value: string): void {
        this.setValue(value);
        this.closeDropdown();

        // Update selected state in dropdown
        this.populateDropdown();

        // Call select callback
        this.callbacks.onOptionSelect?.(value);
    }

    // Update options in select mode
    public updateOptions(options: string[]): void {
        if (!this.isSelectMode) return;

        this.selectOptions = options;
        this.populateDropdown();
    }

    private autoResizeTextarea(): void {
        if (!this.options.multiline || !(this.input instanceof HTMLTextAreaElement)) {
            return;
        }

        const textarea = this.input as HTMLTextAreaElement;
        const maxLines = this.options.maxLines ?? this.defaultMaxLines;

        // Check if there are actual line breaks in the content
        // const actualLineBreaks = (textarea.value.match(/\n/g) || []).length + 1;

        // Reset height to calculate scroll height
        textarea.style.height = "auto";

        // Calculate line height (in pixels)
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
        // Compute visible lines
        const actualLines = Math.floor(textarea.scrollHeight / parseInt(computedStyle.lineHeight));
        // Only expand if user has actually pressed Enter or the text is wrapped
        this.container.style.alignItems = actualLines > 1 || this.options.stretchHeight ? "flex-start" : "center";

        if (actualLines === 1) {
            // Single line: use default height and center content
            textarea.style.height = this.fieldType === TextFieldType.Outlined ? "2rem" : "1.5rem";
            this.container.style.height = "";
        } else {
            // Multiple lines: expand height
            if (this.options.stretchHeight) {
                textarea.style.height = `calc(100% - (${computedStyle.marginTop} + ${computedStyle.marginBottom}))`;
                this.container.style.height = "100%";
            } else {
                // Limit to maxLines
                const linesCount = Math.min(actualLines, maxLines);
                textarea.style.height = linesCount * lineHeight + paddingTop + paddingBottom + "px";
                this.container.style.height = "auto";
            }
            // Enable scrollbar if content exceeds maxLines
            if (this.options.stretchHeight || (actualLines > maxLines && this.element.classList.contains("md-text-field--max-lines"))) {
                textarea.style.overflowY = "auto";
            } else {
                textarea.style.overflowY = "hidden";
            }
        }

        // Grow the parent form-group container to accommodate content, but with max-height constraint
        const parentFormGroup = this.element.closest(".form-group--stretch") as HTMLElement;
        if (parentFormGroup) {
            const HEIGHT_1_REM = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const MIN_FORM_GROUP_HEIGHT = HEIGHT_1_REM * 2;
            if (this.options.stretchHeight) {
                // Calculate required height: content height + label space + padding
                const contentHeight = actualLines * lineHeight + paddingTop + paddingBottom;
                const labelSpace = 1.5 * HEIGHT_1_REM; // Space for floating label
                const formGroupPadding = HEIGHT_1_REM; // Form group internal padding
                const supportingTextSpace = HEIGHT_1_REM; //

                const requiredHeight = contentHeight + labelSpace + formGroupPadding + ((this.options.isRequired ?? false) ? supportingTextSpace : 0);
                // Set height to grow with content, but respect existing max-height
                const minHeight = Math.max(requiredHeight, MIN_FORM_GROUP_HEIGHT); // Minimum 120px
                parentFormGroup.style.height = `${minHeight}px`;
            } else {
                parentFormGroup.style.height = `${MIN_FORM_GROUP_HEIGHT}px`;
            }
        }
    }
}
