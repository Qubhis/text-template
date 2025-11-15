// src/frontend/components/basic-dialogs/DialogSystem.ts

// Compatibility wrapper for the new Dialog component
// Maintains the same interface as the old ModalSystem

import { Dialog } from './Dialog.js';

/**
 * Dialog System Component
 * Provides compatibility wrapper for the new MD3 Dialog component
 * Maintains the same interface as the old ModalSystem
 */
export class DialogSystem {
    private currentDialog: Dialog | null = null;

    constructor() {
        // No DOM element references needed - Dialog creates everything programmatically
    }

    /**
     * Initialize the dialog system
     */
    public initialize(): void {
        // No initialization needed for the new system
        console.log('✅ Dialog system initialized');
    }

    /**
     * Show unsaved changes confirmation dialog
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
     * Show delete confirmation dialog
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
     * Show generic confirmation dialog
     */
    public showConfirmationModal(title: string, message: string, confirmText: string, cancelText: string, onConfirm: () => void): void {
        this.currentDialog?.hide();

        this.currentDialog = new Dialog({
            title,
            content: message,
            buttons: [
                { text: cancelText, action: () => this.hideModal() },
                { text: confirmText, action: () => { this.hideModal(); onConfirm(); } }
            ]
        });

        this.currentDialog.show();
    }

    /**
     * Hide the current dialog
     */
    public hideModal(): void {
        if (this.currentDialog) {
            this.currentDialog.hide();
            this.currentDialog = null;
        }
    }

    /**
     * Cleanup component
     */
    public destroy(): void {
        if (this.currentDialog) {
            this.currentDialog.destroy();
            this.currentDialog = null;
        }
    }
}