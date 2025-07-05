// src/frontend/scripts/utils/domHelpers.ts

// DOM Helper Utilities
// Provides only the DOM operations currently needed by our components

/**
 * Get required element by ID with type safety
 * Throws error if element not found
 */
export function getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id) as T | null;
    if (!element) {
        throw new Error(`Required element with ID "${id}" not found in DOM`);
    }
    return element;
}

/**
 * Set element text content safely
 */
export function setTextContent(element: HTMLElement | null, text: string): void {
    if (element) {
        element.textContent = text;
    }
}

/**
 * Set element visibility
 */
export function setElementVisibility(element: HTMLElement | null, visible: boolean): void {
    if (element) {
        element.style.opacity = visible ? "100%" : "0%";
    }
}

/**
 * Add event listener with automatic cleanup tracking
 */
export function addEventListenerWithCleanup<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
): () => void {
    element.addEventListener(type, listener, options);

    // Return cleanup function
    return () => {
        element.removeEventListener(type, listener, options);
    };
}

/**
 * Add CSS class to element
 */
export function addClass(element: HTMLElement | null, className: string): void {
    if (element) {
        element.classList.add(className);
    }
}

/**
 * Remove CSS class from element
 */
export function removeClass(element: HTMLElement | null, className: string): void {
    if (element) {
        element.classList.remove(className);
    }
}

/**
 * Remove all child elements from container
 */
export function clearChildren(element: HTMLElement | null): void {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

/**
 * Focus element safely
 */
export function focusElement(element: HTMLElement | null): void {
    if (element && typeof element.focus === "function") {
        element.focus();
    }
}
