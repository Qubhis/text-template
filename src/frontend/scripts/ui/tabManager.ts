// src/frontend/scripts/ui/tabManager.ts

// Tab Manager Component
// Handles tab switching between Edit/Preview/Output tabs

import { addEventListenerWithCleanup, addClass, removeClass } from "../utils/domHelpers.js";

export interface TabManagerCallbacks {
    onTabChange?: (tabName: string) => void;
}

/**
 * Tab Manager Component
 * Manages tab switching logic and state
 */
export class TabManager {
    private callbacks: TabManagerCallbacks;
    private cleanupFunctions: (() => void)[] = [];
    private currentTab: string = "edit"; // Default tab

    constructor(callbacks: TabManagerCallbacks = {}) {
        this.callbacks = callbacks;
    }

    /**
     * Initialize the tab manager
     */
    public initialize(): void {
        this.setupEventListeners();
        // Ensure default tab is active
        this.switchTab(this.currentTab);
    }

    /**
     * Set up tab button event listeners
     */
    private setupEventListeners(): void {
        const tabButtons = document.querySelectorAll(".tab-btn");

        tabButtons.forEach((button) => {
            const cleanup = addEventListenerWithCleanup(button as HTMLElement, "click", (e) => {
                const target = e.target as HTMLElement;
                const tabName = target.getAttribute("data-tab");
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
            this.cleanupFunctions.push(cleanup);
        });
    }

    /**
     * Switch to specified tab
     */
    public switchTab(tabName: string): void {
        // Update tab buttons
        const tabButtons = document.querySelectorAll(".tab-btn");
        tabButtons.forEach((btn) => {
            const element = btn as HTMLElement;
            removeClass(element, "active");

            if (element.getAttribute("data-tab") === tabName) {
                addClass(element, "active");
            }
        });

        // Update tab panes
        const tabPanes = document.querySelectorAll(".tab-pane");
        tabPanes.forEach((pane) => {
            const element = pane as HTMLElement;
            removeClass(element, "active");

            if (element.id === `${tabName}Tab`) {
                addClass(element, "active");
            }
        });

        // Update current tab state
        this.currentTab = tabName;

        // Notify callback if provided
        if (this.callbacks.onTabChange) {
            this.callbacks.onTabChange(tabName);
        }

        console.log(`Switched to ${tabName} tab`);
    }
}
