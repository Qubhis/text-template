// src/frontend/scripts/uiErrorHandler.ts
// UI Error Handler & Loading States Management
// Integrates with TemplateManager events to provide user feedback

import TemplateManager, { StateChangeEvent, StateChangeListener } from "./templateManager.js";
import { ApiUtils } from "./apiClient.js";

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
        const successListener: StateChangeListener = (event, data) => this.handleSuccess(event, data);

        this.templateManager.addEventListener("loading-start", loadingStartListener);
        this.templateManager.addEventListener("loading-end", loadingEndListener);
        this.templateManager.addEventListener("error-occurred", errorListener);
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
     * Show loading state
     */
    showLoading(operation?: string): void {
        this.loadingState = {
            isLoading: true,
            operation,
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
