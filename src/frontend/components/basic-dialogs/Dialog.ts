// src/frontend/components/basic-dialogs/Dialog.ts

// Material Design 3 Basic Dialog Component

export interface DialogButton {
    text: string;
    action: () => void;
}

export interface DialogConfig {
    title: string;
    content: string;
    buttons?: DialogButton[];
    contentWidth?: string;
    contentHeight?: string;
}

/**
 * Material Design 3 Basic Dialog Component
 * Creates and manages dialogs according to MD3 specifications
 */
export class Dialog {
    private scrim: HTMLElement;
    private container: HTMLElement;
    private isVisible: boolean = false;

    constructor(private config: DialogConfig) {
        this.createElements();
        this.setupEventListeners();
    }

    /**
     * Create all dialog DOM elements programmatically
     */
    private createElements(): void {
        // Create scrim
        this.scrim = this.createElement('div', 'md-dialog-scrim', { role: 'presentation' });
        
        // Create container
        this.container = this.createElement('div', 'md-dialog-container', { 
            role: 'dialog', 
            'aria-modal': 'true', 
            'aria-labelledby': 'dialog-title' 
        });

        // Apply optional sizing
        if (this.config.contentWidth) this.container.style.width = this.config.contentWidth;
        if (this.config.contentHeight) {
            const content = this.container.querySelector('.md-dialog-content') as HTMLElement;
            if (content) content.style.height = this.config.contentHeight;
        }

        // Assemble dialog
        this.container.innerHTML = `
            <h2 class="md-dialog-title" id="dialog-title">${this.config.title}</h2>
            <div class="md-dialog-content">${this.config.content}</div>
            <div class="md-dialog-actions">${this.createButtonsHTML()}</div>
        `;

        this.scrim.appendChild(this.container);
        this.attachButtonListeners();
    }

    private createElement(tag: string, className: string, attributes: Record<string, string> = {}): HTMLElement {
        const element = document.createElement(tag);
        element.className = className;
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    }

    /**
     * Create buttons HTML string
     */
    private createButtonsHTML(): string {
        const buttons = this.config.buttons || [{ text: 'Close', action: () => this.hide() }];
        
        if (buttons.length > 2) {
            console.warn('MD3 Dialog: Maximum of 2 buttons recommended.');
        }

        return buttons.map((button, index) => {
            const buttonType = buttons.length === 1 ? 'primary' : (index === 0 ? 'secondary' : 'primary');
            return `<button class="md-dialog-button md-dialog-button-${buttonType}" data-action="${index}">${button.text}</button>`;
        }).join('');
    }

    /**
     * Attach event listeners to buttons
     */
    private attachButtonListeners(): void {
        const buttons = this.config.buttons || [{ text: 'Close', action: () => this.hide() }];
        
        this.container.querySelectorAll('[data-action]').forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                buttons[index].action();
            });
        });
    }

    /**
     * Set up event listeners for dialog behavior
     */
    private setupEventListeners(): void {
        // Close on scrim click and escape key
        this.scrim.addEventListener('click', (e) => {
            if (e.target === this.scrim) this.hide();
        });

        document.addEventListener('keydown', (e) => {
            if (this.isVisible && e.key === 'Escape') {
                e.preventDefault();
                this.hide();
            }
        });
    }

    /**
     * Show the dialog
     */
    public show(): void {
        if (this.isVisible) return;

        document.body.appendChild(this.scrim);
        this.isVisible = true;

        // Animate in
        requestAnimationFrame(() => {
            this.scrim.classList.add('md-dialog-scrim-visible');
            this.container.classList.add('md-dialog-container-visible');
        });

        // Focus first button
        const firstButton = this.container.querySelector('button') as HTMLElement;
        firstButton?.focus();
    }

    /**
     * Hide the dialog
     */
    public hide(): void {
        if (!this.isVisible) return;

        this.scrim.classList.remove('md-dialog-scrim-visible', 'md-dialog-container-visible');

        setTimeout(() => {
            if (this.scrim.parentNode) {
                document.body.removeChild(this.scrim);
            }
            this.isVisible = false;
        }, 200);
    }

    /**
     * Destroy dialog and clean up
     */
    public destroy(): void {
        if (this.scrim.parentNode) {
            document.body.removeChild(this.scrim);
        }
        this.isVisible = false;
    }
}