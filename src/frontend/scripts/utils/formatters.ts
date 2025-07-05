// src/frontend/scripts/utils/formatters.ts

// Text and Date Formatting Utilities
// Provides only the formatting functions currently needed

/**
 * Format date string for display
 */
export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid date";
    }
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
