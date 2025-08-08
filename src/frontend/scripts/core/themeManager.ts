/**
 * Theme Manager - Handles theme operations and persistence
 * Keeps theme logic separate from UI components
 */

export class ThemeManager {
    private static instance: ThemeManager;

    // Available themes
    private readonly availableColorThemes = ["electric-amethyst", "greenish", "mustard-yellow", "oceanic-mirage"];
    private readonly availableModes = ["light", "dark"];

    private constructor() {
        this.initializeTheme();
    }

    static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    /**
     * Initialize theme from localStorage or defaults
     */
    private initializeTheme(): void {
        const savedMode = localStorage.getItem("theme-mode") || "light";
        const savedColorTheme = localStorage.getItem("color-theme") || "electric-amethyst";

        this.setMode(savedMode);
        this.setColorTheme(savedColorTheme);
    }

    /**
     * Set light or dark mode
     */
    setMode(mode: string): void {
        if (!this.availableModes.includes(mode)) {
            console.warn(`Invalid theme mode: ${mode}`);
            return;
        }

        document.documentElement.setAttribute("data-theme", mode);
        localStorage.setItem("theme-mode", mode);
    }

    /**
     * Set color theme
     */
    setColorTheme(colorTheme: string): void {
        if (!this.availableColorThemes.includes(colorTheme)) {
            console.warn(`Invalid color theme: ${colorTheme}`);
            return;
        }

        document.documentElement.setAttribute("data-color-theme", colorTheme);
        localStorage.setItem("color-theme", colorTheme);
    }

    /**
     * Convenience methods
     */
    setLightMode(): void {
        this.setMode("light");
    }

    setDarkMode(): void {
        this.setMode("dark");
    }

    /**
     * Get current theme state
     */
    getCurrentTheme(): { mode: string; colorTheme: string } {
        return {
            mode: document.documentElement.getAttribute("data-theme") || "light",
            colorTheme: document.documentElement.getAttribute("data-color-theme") || "electric-amethyst",
        };
    }

    /**
     * Get available options
     */
    getAvailableColorThemes(): string[] {
        return [...this.availableColorThemes];
    }

    getAvailableModes(): string[] {
        return [...this.availableModes];
    }
}
