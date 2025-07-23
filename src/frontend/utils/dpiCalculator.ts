export class DPICalculator {
    private cachedDPI: number | null = null;
    private dpToPxRatio: number | null = null;

    measureDPI(): number {
        if (this.cachedDPI !== null) {
            return this.cachedDPI;
        }

        const testElement = document.createElement("div");
        testElement.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: 1in;
            height: 1in;
            visibility: hidden;
            pointer-events: none;
        `;

        document.body.appendChild(testElement);
        this.cachedDPI = testElement.offsetWidth;
        document.body.removeChild(testElement);

        return this.cachedDPI;
    }

    getDpToPxRatio(): number {
        if (this.dpToPxRatio !== null) {
            return this.dpToPxRatio;
        }

        const actualDPI = this.measureDPI();

        // For responsive scaling, we need a baseline that works across devices
        // Use a hybrid approach: devicePixelRatio as fallback, but prefer measured DPI
        const devicePixelRatio = window.devicePixelRatio || 1;

        // If measured DPI seems reasonable (between 72-300), use it with appropriate baseline
        if (actualDPI >= 72 && actualDPI <= 300) {
            // Use 96 as baseline for desktop-first approach
            // On mobile, this will naturally scale up due to higher DPI
            this.dpToPxRatio = actualDPI / 96;
        } else {
            // Fallback to devicePixelRatio if DPI measurement seems unreliable
            this.dpToPxRatio = devicePixelRatio;
        }

        return this.dpToPxRatio;
    }

    setCSSVariable(): void {
        const ratio = this.getDpToPxRatio();
        document.documentElement.style.setProperty("--dp-to-px", `${ratio.toString()}px`);
    }

    recalculate(): void {
        this.cachedDPI = null;
        this.dpToPxRatio = null;
        this.setCSSVariable();
    }
}
