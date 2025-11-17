import { addEventListenerWithCleanup } from "../../scripts/utils/domHelpers";

export interface MenuItemConfig {
    label: string;
    action: () => void;
    danger?: boolean;
}

export interface ThreeDotMenuButtonConfig {
    items: MenuItemConfig[];
    buttonClassName?: string;
}

const THREE_DOTS_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon" viewBox="0 0 16 16">
    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
</svg>
`;

export class ThreeDotMenuButton {
    private container: HTMLElement;
    private button: HTMLButtonElement;
    private dropdown: HTMLElement;
    private config: ThreeDotMenuButtonConfig;
    private cleanupFunctions: (() => void)[] = [];
    private isOpen: boolean = false;
    private outsideClickHandler: (e: MouseEvent) => void;
    private escapeKeyHandler: (e: KeyboardEvent) => void;

    constructor(config: ThreeDotMenuButtonConfig) {
        this.config = config;
        this.container = this.createContainer();
        this.button = this.createButton();
        this.dropdown = this.createDropdown();

        this.container.appendChild(this.button);
        this.container.appendChild(this.dropdown);

        // Initialize event handlers
        this.outsideClickHandler = (e: MouseEvent) => {
            if (this.isOpen && !this.container.contains(e.target as Node)) {
                this.close();
            }
        };

        this.escapeKeyHandler = (e: KeyboardEvent) => {
            if (this.isOpen && e.key === "Escape") {
                this.close();
            }
        };

        this.setupEventListeners();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement("div");
        container.className = "menu-button-container";
        return container;
    }

    private createButton(): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = this.config.buttonClassName || "btn btn-transparent";
        button.innerHTML = THREE_DOTS_ICON;
        button.setAttribute("aria-label", "Template actions");
        button.setAttribute("aria-haspopup", "true");
        button.setAttribute("aria-expanded", "false");
        return button;
    }

    private createDropdown(): HTMLElement {
        const dropdown = document.createElement("div");
        dropdown.className = "menu-button__dropdown";
        dropdown.setAttribute("role", "menu");

        this.config.items.forEach((item) => {
            const option = document.createElement("div");
            option.className = "menu-button__item";
            option.setAttribute("role", "menuitem");
            option.textContent = item.label;

            if (item.danger) {
                option.classList.add("menu-button__item--danger");
            }

            const cleanup = addEventListenerWithCleanup(option, "click", (e) => {
                e.stopPropagation();
                item.action();
                this.close();
            });

            this.cleanupFunctions.push(cleanup);
            dropdown.appendChild(option);
        });

        return dropdown;
    }

    private setupEventListeners(): void {
        const buttonCleanup = addEventListenerWithCleanup(this.button, "click", (e) => {
            e.stopPropagation();
            this.toggle();
        });
        this.cleanupFunctions.push(buttonCleanup);

        // Add document-level listeners
        document.addEventListener("click", this.outsideClickHandler);
        document.addEventListener("keydown", this.escapeKeyHandler);
    }

    private toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        this.isOpen = true;
        this.container.classList.add("menu-button--opened");
        this.button.setAttribute("aria-expanded", "true");
    }

    private close(): void {
        this.isOpen = false;
        this.container.classList.remove("menu-button--opened");
        this.button.setAttribute("aria-expanded", "false");
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public enable(): void {
        this.button.disabled = false;
    }

    public disable(): void {
        this.button.disabled = true;
        if (this.isOpen) {
            this.close();
        }
    }

    public destroy(): void {
        // Remove document-level listeners
        document.removeEventListener("click", this.outsideClickHandler);
        document.removeEventListener("keydown", this.escapeKeyHandler);

        // Remove other listeners
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
        this.container.remove();
    }
}
