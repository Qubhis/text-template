import { ThemeManager } from "../core/themeManager.js";
import { OutlinedTextField } from "../../components/text-fields/OutlinedTextField.js";

/**
 * Theme Settings Dialog - Positioned popover for theme selection
 * Shows near settings button without scrim overlay
 */

export class ThemeSettingsDialog {
    private dialog!: HTMLElement;
    private themeManager = ThemeManager.getInstance();
    private colorThemeField!: OutlinedTextField;

    constructor() {
        this.createDialog();
        this.bindEvents();
    }

    private createDialog(): void {
        this.dialog = document.createElement("div");
        this.dialog.className = "theme-settings-dialog";

        this.dialog.innerHTML = `
            <div class="dialog-content">
                <h3 class="dialog-title">Theme Settings</h3>
                
                <div class="theme-option">
                    <label class="theme-label">Appearance</label>
                    <button type="button" class="btn btn-secondary btn-small theme-toggle-btn">
                        ☀️ Light
                    </button>
                </div>
                
                <div class="theme-option">
                    <label class="theme-label">Color Theme</label>
                    <div class="color-theme-field-container"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.dialog);

        // Create OutlinedTextField for color theme selection
        this.createColorThemeField();
    }

    private createColorThemeField(): void {
        const container = this.dialog.querySelector(".color-theme-field-container") as HTMLElement;
        const colorThemes = this.themeManager.getAvailableColorThemes();

        this.colorThemeField = new OutlinedTextField(
            {
                label: "",
            },
            {
                onOptionSelect: () => this.applyTheme(),
            }
        );

        const selectOptions = colorThemes.map((theme) => this.formatThemeName(theme));
        this.colorThemeField.setSelectMode(selectOptions);

        container.appendChild(this.colorThemeField.getElement());
    }

    private formatThemeName(theme: string): string {
        return theme
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    private bindEvents(): void {
        // Close on outside click
        document.addEventListener("click", (e) => {
            const isDropDownOption = (e.target && (e.target as HTMLElement)?.classList?.contains("md-text-field__dropdown-option")) ?? false;
            if (this.dialog.classList.contains("visible") && !this.dialog.contains(e.target as Node) && !isDropDownOption) {
                this.close();
            }
        });

        // Theme mode toggle button
        const themeToggleBtn = this.dialog.querySelector(".theme-toggle-btn") as HTMLButtonElement;
        themeToggleBtn.addEventListener("click", () => {
            this.toggleMode();
            this.applyTheme();
        });
    }

    private toggleMode(): void {
        const toggleBtn = this.dialog.querySelector(".theme-toggle-btn") as HTMLButtonElement;
        const currentTheme = this.themeManager.getCurrentTheme();
        const newMode = currentTheme.mode === "light" ? "dark" : "light";

        // Update button text and icon
        toggleBtn.innerHTML = newMode === "light" ? "☀️ Light" : "🌙 Dark";
    }

    private applyTheme(): void {
        const toggleBtn = this.dialog.querySelector(".theme-toggle-btn") as HTMLButtonElement;
        const newMode = toggleBtn.innerHTML.includes("Light") ? "light" : "dark";

        // Get color theme from OutlinedTextField - convert display name back to theme value
        const displayName = this.colorThemeField.getValue();
        const colorThemes = this.themeManager.getAvailableColorThemes();

        const selectedColorTheme = colorThemes.find((theme) => {
            return this.formatThemeName(theme) === displayName;
        });
        if (!selectedColorTheme) throw new Error("[BUG]");

        // Apply theme using ThemeManager
        this.themeManager.setMode(newMode);
        this.themeManager.setColorTheme(selectedColorTheme);
    }

    show(): void {
        if (this.dialog.classList.contains("visible")) return;

        // Load current theme state and show dialog
        this.loadCurrentTheme();
        this.dialog.classList.add("visible");
    }

    close(): void {
        this.dialog.classList.remove("visible");
    }

    private loadCurrentTheme(): void {
        const currentTheme = this.themeManager.getCurrentTheme();

        // Update toggle button to show current mode
        const toggleBtn = this.dialog.querySelector(".theme-toggle-btn") as HTMLButtonElement;
        toggleBtn.innerHTML = currentTheme.mode === "light" ? "☀️ Light" : "🌙 Dark";

        // Update color theme field to show current color theme
        const displayName = this.formatThemeName(currentTheme.colorTheme);
        this.colorThemeField.setValue(displayName);
    }
}
