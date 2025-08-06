// src/frontend/components/text-fields/TextFieldBase.ts

// Base class for Material Design 3 text fields
// Provides core functionality for both filled and outlined variants

export interface TextFieldOptions {
    label: string;
    multiline?: boolean;
    maxLines?: number; // For outlined fields with hidden scrollbar
    stretchHeight?: boolean; // For filled content field
    value?: string;
}

export interface TextFieldCallbacks {
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onOptionSelect?: (value: string) => void;
}

// Simple dropdown arrow SVG
export const DROPDOWN_ARROW_SVG = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M7 10l5 5 5-5z"/>
</svg>
`;

export abstract class TextFieldBase {
    private readonly defaultMaxLines = 999;

    protected element: HTMLElement;
    protected container: HTMLElement;
    protected input: HTMLInputElement | HTMLTextAreaElement;
    protected label: HTMLElement;
    protected supportingText: HTMLElement;

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
            if (this.options.maxLines) {
                this.input.style.maxHeight = `${this.options.maxLines * 1.5}em`;
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

        // Create label
        this.label = document.createElement("label");
        this.label.className = "md-text-field__label";
        this.label.textContent = this.options.label;

        // Create supporting text (hidden by default)
        this.supportingText = document.createElement("div");
        this.supportingText.className = "md-text-field__supporting-text";
        this.supportingText.style.display = "none";

        // Assemble DOM
        this.container.appendChild(this.input);
        this.container.appendChild(this.label);
        this.addVariantSpecificElements();

        this.element.appendChild(this.container);
        this.element.appendChild(this.supportingText);

        // Initial auto-resize for pre-existing content
        setTimeout(() => this.autoResizeTextarea(), 0);
    }

    private setupEventListeners(): void {
        // Input events
        this.input.addEventListener("input", () => {
            this.currentValue = this.input.value;
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

        // Update classes
        this.element.classList.toggle("md-text-field--populated", isPopulated);
        this.element.classList.toggle("md-text-field--focused", this.isFocused);
        this.element.classList.toggle("md-text-field--hovered", this.isHovered);
        this.element.classList.toggle("md-text-field--error", hasError);

        // Update supporting text
        if (hasError) {
            this.supportingText.textContent = this.errorMessage;
            this.supportingText.style.display = "block";
        } else {
            this.supportingText.style.display = "none";
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
        const actualLineBreaks = (textarea.value.match(/\n/g) || []).length + 1;

        // Reset height to calculate scroll height
        textarea.style.height = "auto";

        // Calculate line height (in pixels)
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingBottom = parseFloat(computedStyle.paddingBottom);

        // Calculate number of lines needed based on scroll height

        // Use the actual line breaks count, not the calculated wrapped lines
        // Only expand if user has actually pressed Enter
        const lines = actualLineBreaks;

        // Limit to maxLines
        const actualLines = Math.min(lines, maxLines);

        // Set height based on actual line breaks, not wrapped content
        if (lines === 1) {
            // Single line: use default height and center content
            textarea.style.height = "2rem";
            this.container.style.height = "";
            this.container.style.alignItems = "center";
        } else {
            let newHeight;
            // Multiple lines: expand height
            if (this.options.stretchHeight) {
                newHeight = "100%";
            } else {
                newHeight = actualLines * lineHeight + paddingTop + paddingBottom + "px";
            }
            textarea.style.height = newHeight;
            this.container.style.height = "auto";
            this.container.style.alignItems = "flex-start";

            // Enable scrollbar if content exceeds maxLines
            if (this.options.stretchHeight || (lines > maxLines && this.element.classList.contains("md-text-field--max-lines"))) {
                textarea.style.overflowY = "auto";
            } else {
                textarea.style.overflowY = "hidden";
            }
        }
    }
}
