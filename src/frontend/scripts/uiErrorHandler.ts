// src/frontend/scripts/uiErrorHandler.ts
// UI Error Handler & Loading States Management
// Integrates with TemplateManager events to provide user feedback

import { TemplateManager, StateChangeEvent, StateChangeListener } from "./templateManager";
import { ApiUtils } from "./apiClient";

// Error display types
export type ErrorType = "error" | "warning" | "info" | "success";

// Error notification interface
export interface ErrorNotification {
    id: string;
    type: ErrorType;
    title: string;
    message: string;
    timestamp: Date;
    autoHide?: boolean;
    duration?: number; // milliseconds
    actions?: ErrorAction[];
}

// Error action interface
export interface ErrorAction {
    label: string;
    handler: () => void;
    style?: "primary" | "secondary" | "danger";
}

// Loading state interface
export interface LoadingState {
    isLoading: boolean;
    operation?: string;
    progress?: number; // 0-100
}

/**
 * UI Error Handler
 * Manages error display, loading states, and user feedback
 */
export class UIErrorHandler {
    private templateManager: TemplateManager;
    private notifications: Map<string, ErrorNotification>;
    private loadingState: LoadingState;
    private notificationContainer: HTMLElement | null = null;
    private loadingOverlay: HTMLElement | null = null;
    private notificationCounter = 0;

    constructor(templateManager: TemplateManager) {
        this.templateManager = templateManager;
        this.notifications = new Map();
        this.loadingState = { isLoading: false };
        this.initializeUI();
        this.setupEventListeners();
    }

    /**
     * Initialize UI elements
     */
    private initializeUI(): void {
        // Find existing elements
        this.loadingOverlay = document.getElementById("loadingOverlay");
        this.notificationContainer = document.getElementById("notificationContainer");

        if (!this.notificationContainer) {
            console.error(
                'Notification container not found in HTML. Please add <div id="notificationContainer" class="notification-container"></div> to the HTML.'
            );
        }
    }

    /**
     * Setup event listeners for TemplateManager
     */
    private setupEventListeners(): void {
        const loadingStartListener: StateChangeListener = () => this.handleLoadingStart();
        const loadingEndListener: StateChangeListener = () => this.handleLoadingEnd();
        const errorListener: StateChangeListener = (event, data) => this.handleError(event, data);
        const errorClearedListener: StateChangeListener = () => this.handleErrorCleared();
        const successListener: StateChangeListener = (event, data) => this.handleSuccess(event, data);

        this.templateManager.addEventListener("loading-start", loadingStartListener);
        this.templateManager.addEventListener("loading-end", loadingEndListener);
        this.templateManager.addEventListener("error-occurred", errorListener);
        this.templateManager.addEventListener("error-cleared", errorClearedListener);
        this.templateManager.addEventListener("template-created", successListener);
        this.templateManager.addEventListener("template-updated", successListener);
        this.templateManager.addEventListener("template-deleted", successListener);
    }

    /**
     * Show error notification
     */
    showError(title: string, message: string, actions?: ErrorAction[]): string {
        const notification: ErrorNotification = {
            id: this.generateNotificationId(),
            type: "error",
            title,
            message,
            timestamp: new Date(),
            autoHide: false,
            actions,
        };

        return this.showNotification(notification);
    }

    /**
     * Show warning notification
     */
    showWarning(title: string, message: string, autoHide = true): string {
        const notification: ErrorNotification = {
            id: this.generateNotificationId(),
            type: "warning",
            title,
            message,
            timestamp: new Date(),
            autoHide,
            duration: 5000,
        };

        return this.showNotification(notification);
    }

    /**
     * Show info notification
     */
    showInfo(title: string, message: string, autoHide = true): string {
        const notification: ErrorNotification = {
            id: this.generateNotificationId(),
            type: "info",
            title,
            message,
            timestamp: new Date(),
            autoHide,
            duration: 4000,
        };

        return this.showNotification(notification);
    }

    /**
     * Show success notification
     */
    showSuccess(title: string, message: string, autoHide = true): string {
        const notification: ErrorNotification = {
            id: this.generateNotificationId(),
            type: "success",
            title,
            message,
            timestamp: new Date(),
            autoHide,
            duration: 3000,
        };

        return this.showNotification(notification);
    }

    /**
     * Hide notification by ID
     */
    hideNotification(id: string): void {
        const notification = this.notifications.get(id);
        if (notification) {
            this.notifications.delete(id);
            this.removeNotificationFromDOM(id);
        }
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications(): void {
        this.notifications.clear();
        if (this.notificationContainer) {
            this.notificationContainer.innerHTML = "";
        }
    }

    /**
     * Show loading state
     */
    showLoading(operation?: string, progress?: number): void {
        this.loadingState = {
            isLoading: true,
            operation,
            progress,
        };

        this.updateLoadingUI();
    }

    /**
     * Hide loading state
     */
    hideLoading(): void {
        this.loadingState = { isLoading: false };
        this.updateLoadingUI();
    }

    /**
     * Update loading progress
     */
    updateProgress(progress: number, operation?: string): void {
        if (this.loadingState.isLoading) {
            this.loadingState.progress = progress;
            if (operation) {
                this.loadingState.operation = operation;
            }
            this.updateLoadingUI();
        }
    }

    /**
     * Show error with retry option
     */
    showErrorWithRetry(title: string, message: string, retryAction: () => void): string {
        const actions: ErrorAction[] = [
            {
                label: "Retry",
                handler: retryAction,
                style: "primary",
            },
            {
                label: "Dismiss",
                handler: () => {}, // Will be handled by notification close
                style: "secondary",
            },
        ];

        return this.showError(title, message, actions);
    }

    // Private methods

    private handleLoadingStart(): void {
        const state = this.templateManager.getState();
        this.showLoading("Loading...");
    }

    private handleLoadingEnd(): void {
        this.hideLoading();
    }

    private handleError(event: StateChangeEvent, data: any): void {
        if (data && data.originalError) {
            const userMessage = ApiUtils.getErrorMessage(data.originalError);
            const isRetryable = this.isRetryableError(data.originalError);

            if (isRetryable) {
                this.showErrorWithRetry("Operation Failed", userMessage, () => this.retryLastOperation(data.originalError));
            } else {
                this.showError("Error", userMessage);
            }
        } else {
            this.showError("Error", data?.message || "An unexpected error occurred");
        }
    }

    private handleErrorCleared(): void {
        // Don't automatically clear all notifications - let user dismiss them
        // This gives them time to read error messages
    }

    private handleSuccess(event: StateChangeEvent, data: any): void {
        const successMessages = {
            "template-created": "Template created successfully",
            "template-updated": "Template updated successfully",
            "template-deleted": "Template deleted successfully",
        };

        const message = successMessages[event as keyof typeof successMessages];
        if (message) {
            this.showSuccess("Success", message);
        }
    }

    private generateNotificationId(): string {
        return `notification-${++this.notificationCounter}-${Date.now()}`;
    }

    private showNotification(notification: ErrorNotification): string {
        this.notifications.set(notification.id, notification);
        this.addNotificationToDOM(notification);

        // Auto-hide if specified
        if (notification.autoHide && notification.duration) {
            setTimeout(() => {
                this.hideNotification(notification.id);
            }, notification.duration);
        }

        return notification.id;
    }

    private addNotificationToDOM(notification: ErrorNotification): void {
        if (!this.notificationContainer) return;

        const element = document.createElement("div");
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;

        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <strong class="notification-title">${this.escapeHtml(notification.title)}</strong>
                    <button class="notification-close" aria-label="Close notification">&times;</button>
                </div>
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                ${notification.actions ? this.renderActions(notification.actions) : ""}
                <div class="notification-timestamp">${this.formatTimestamp(notification.timestamp)}</div>
            </div>
        `;

        // Add event listeners
        const closeBtn = element.querySelector(".notification-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.hideNotification(notification.id));
        }

        // Add action event listeners
        if (notification.actions) {
            notification.actions.forEach((action, index) => {
                const actionBtn = element.querySelector(`[data-action-index="${index}"]`);
                if (actionBtn) {
                    actionBtn.addEventListener("click", () => {
                        action.handler();
                        if (action.label !== "Retry") {
                            this.hideNotification(notification.id);
                        }
                    });
                }
            });
        }

        this.notificationContainer.appendChild(element);
    }

    private removeNotificationFromDOM(id: string): void {
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.remove();
        }
    }

    private updateLoadingUI(): void {
        if (!this.loadingOverlay) return;

        if (this.loadingState.isLoading) {
            this.loadingOverlay.classList.add("show");

            // Update loading text
            const loadingText = this.loadingOverlay.querySelector("p");
            if (loadingText && this.loadingState.operation) {
                loadingText.textContent = this.loadingState.operation;
            }

            // Update progress if available
            const progressBar = this.loadingOverlay.querySelector(".progress-bar");
            if (progressBar && this.loadingState.progress !== undefined) {
                (progressBar as HTMLElement).style.width = `${this.loadingState.progress}%`;
            }
        } else {
            this.loadingOverlay.classList.remove("show");
        }
    }

    private renderActions(actions: ErrorAction[]): string {
        return `
            <div class="notification-actions">
                ${actions
                    .map(
                        (action, index) => `
                    <button class="btn btn-${action.style || "secondary"}" data-action-index="${index}">
                        ${this.escapeHtml(action.label)}
                    </button>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    private formatTimestamp(timestamp: Date): string {
        return timestamp.toLocaleTimeString();
    }

    private isRetryableError(error: any): boolean {
        return ApiUtils.isNetworkError(error) || ApiUtils.isTimeoutError(error) || ApiUtils.isServerError(error);
    }

    private retryLastOperation(error: any): void {
        // For now, just refresh templates
        // In a more sophisticated app, we'd track the last operation and retry it
        this.templateManager.refreshTemplates();
    }
}

export default UIErrorHandler;
