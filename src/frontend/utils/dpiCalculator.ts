export class DPICalculator {
    private cachedDPI: number | null = null;
    private dpToPxRatio: number | null = null;

    measureDPI(): number {
        if (this.cachedDPI !== null) {
            return this.cachedDPI;
        }

        const testElement = document.createElement('div');
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
        this.dpToPxRatio = actualDPI / 160;
        return this.dpToPxRatio;
    }

    setCSSVariable(): void {
        const ratio = this.getDpToPxRatio();
        document.documentElement.style.setProperty('--dp-to-px', ratio.toString());
    }

    recalculate(): void {
        this.cachedDPI = null;
        this.dpToPxRatio = null;
        this.setCSSVariable();
    }
}