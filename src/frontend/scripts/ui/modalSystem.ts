// src/frontend/scripts/ui/modalSystem.ts

// Modal System Component
// Handles confirmation dialogs and modal interactions

import { getRequiredElement, addEventListenerWithCleanup, addClass, removeClass } from "../utils/domHelpers.js";

/**
 * Modal System Component
 * Manages confirmation dialogs and modal display
 */
export class ModalSystem {
    private cleanupFunctions: (() => void)[] = [];

    // DOM Elements
    private modal: HTMLElement;
    private titleElement: HTMLElement;
    private messageElement: HTMLElement;
    private confirmButton: HTMLElement;
    private cancelButton: HTMLElement;

    constructor() {
        // Get required DOM elements
        this.modal = getRequiredElement<HTMLElement>("confirmDialog");
        this.titleElement = getRequiredElement<HTMLElement>("confirmTitle");
        this.messageElement = getRequiredElement<HTMLElement>("confirmMessage");
        this.confirmButton = getRequiredElement<HTMLElement>("confirmYes");
        this.cancelButton = getRequiredElement<HTMLElement>("confirmNo");
    }

    /**
     * Initialize the modal system
     */
    public initialize(): void {
        this.setupEventListeners();
    }

    /**
     * Set up modal event listeners
     */
    private setupEventListeners(): void {
        // Cancel button closes modal
        const cancelCleanup = addEventListenerWithCleanup(this.cancelButton, "click", () => this.hideModal());
        this.cleanupFunctions.push(cancelCleanup);
    }

    /**
     * Show unsaved changes confirmation modal
     */
    public showUnsavedChangesModal(onConfirm: () => void): void {
        this.showConfirmationModal(
            "Unsaved Changes",
            "You have unsaved changes. Are you sure you want to continue? Your changes will be lost.",
            "Continue",
            "Keep Editing",
            onConfirm
        );
    }

    /**
     * Show delete confirmation modal
     */
    public showDeleteConfirmationModal(templateTitle: string, onConfirm: () => void): void {
        this.showConfirmationModal(
            "Delete Template",
            `Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`,
            "Delete",
            "Cancel",
            onConfirm
        );
    }

    /**
     * Show generic confirmation modal
     */
    public showConfirmationModal(title: string, message: string, confirmText: string, cancelText: string, onConfirm: () => void): void {
        // Set modal content
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;
        this.confirmButton.textContent = confirmText;
        this.cancelButton.textContent = cancelText;

        // Remove any existing confirm listeners by replacing the element
        const newConfirmButton = this.confirmButton.cloneNode(true) as HTMLElement;
        this.confirmButton.parentNode?.replaceChild(newConfirmButton, this.confirmButton);
        this.confirmButton = newConfirmButton;

        // Add new confirm listener
        const confirmCleanup = addEventListenerWithCleanup(this.confirmButton, "click", () => {
            this.hideModal();
            onConfirm();
        });
        this.cleanupFunctions.push(confirmCleanup);

        // Show modal
        this.showModal();
    }

    /**
     * Show the modal
     */
    private showModal(): void {
        addClass(this.modal, "show");
    }

    /**
     * Hide the modal
     */
    public hideModal(): void {
        removeClass(this.modal, "show");
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        // Remove all event listeners
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];
    }
}
