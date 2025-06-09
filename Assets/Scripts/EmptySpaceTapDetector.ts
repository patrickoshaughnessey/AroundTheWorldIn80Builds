
// EmptySpaceTapDetector - detects pinch gestures in empty space and shows guidance tooltips
// Uses MaxvanLeeuwen's Hints.js and HandTracking.js utilities

// Declare global objects from Max's utilities
declare global {
    var HandTracking: any;
    var Hints: any;
    var DoDelay: any;
}

@component
export class EmptySpaceTapDetector extends BaseScriptComponent {

    @input()
    @hint("Text to display in the tooltip to guide users")
    tooltipText: string = "Pinch in empty space to open menu"

    @input()
    @hint("How long to show the tooltip in seconds")
    tooltipDuration: number = 3.0

    @input()
    @hint("Show tooltip automatically when hands are detected")
    autoShowTooltip: boolean = true

    @input()
    @hint("Minimum time between showing tooltips (to avoid spam)")
    tooltipCooldown: number = 2.0

    @input()
    @hint("Distance threshold for detecting UI interaction (world units)")
    uiInteractionDistance: number = 15.0

    @input()
    @hint("Optional parent object for tooltip positioning")
    tooltipParent: SceneObject = null

    // Callback event for when empty space tap is detected
    public onEmptySpaceTap: () => void = null

    // Internal state
    private isShowingTooltip: boolean = false
    private lastTooltipTime: number = 0
    private tooltipHint: any = null // Hints.Dot instance
    private handTextDelay: any = null // DoDelay instance
    private autoTooltipDelay: any = null // DoDelay instance

    // Hand tracking event handlers
    private pinchStartHandler: (position: vec3) => void
    private pinchEndHandler: (position: vec3) => void
    private updateHandler: () => void

    onAwake() {
        this.setupHandTrackingCallbacks()
        this.startAutoTooltipCheck()
    }

    private setupHandTrackingCallbacks(): void {
        // Check if HandTracking is available
        if (!HandTracking) {
            print("EmptySpaceTapDetector: Warning - HandTracking not available")
            return
        }

        // Bind methods to preserve 'this' context
        this.pinchStartHandler = this.onPinchStart.bind(this)
        this.pinchEndHandler = this.onPinchEnd.bind(this)
        this.updateHandler = this.onUpdate.bind(this)

        // Add hand tracking event listeners
        HandTracking.onPinchStart.add(this.pinchStartHandler)
        HandTracking.onPinchEnd.add(this.pinchEndHandler)

        // Add update event for hover detection
        const updateEvent = this.createEvent("UpdateEvent")
        updateEvent.bind(this.updateHandler)
    }

    private startAutoTooltipCheck(): void {
        if (!this.autoShowTooltip || !DoDelay) return

        // Check periodically if we should show tooltip
        this.autoTooltipDelay = new DoDelay(() => {
            if (this.shouldShowAutoTooltip()) {
                this.showTooltip()
            }
            // Recursive call to keep checking
            this.startAutoTooltipCheck()
        })
        this.autoTooltipDelay.byTime(1.0) // Check every second
    }

    private shouldShowAutoTooltip(): boolean {
        // Don't show if already showing or on cooldown
        if (this.isShowingTooltip) return false
        if (this.getTimeSinceLastTooltip() < this.tooltipCooldown) return false

        // Check if hands are being tracked
        if (!HandTracking) return false

        const hoverPos = HandTracking.getHoverWorldPosition()
        if (!hoverPos) return false

        // Check if user is not interacting with UI
        return true
    }

    private onUpdate(): void {
        // Show hand text hint when hovering in empty space
        if (!HandTracking || !Hints) return

        const hoverPos = HandTracking.getHoverWorldPosition()

        if (hoverPos && !HandTracking.getPinching()) {
                // Show pinch hint
            Hints.showHandText("pinch to open menu")
        } else {
            Hints.hideHandText()
        }
    }

    private onPinchStart = (position: vec3) => {
        if (!position) return

        print("EmptySpaceTapDetector: Empty space pinch detected!")

        // Hide any current tooltip
        this.hideTooltip()

        // Hide hand text
        if (Hints) {
            Hints.hideHandText()
        }

        // Call the callback if assigned
        if (this.onEmptySpaceTap) {
            this.onEmptySpaceTap()
        } else {
            print("EmptySpaceTapDetector: No callback assigned for empty space tap")
        }
    }

    private onPinchEnd = (position: vec3) => {
        // Can add logic here if needed for pinch end events
    }

    private getTimeSinceLastTooltip(): number {
        return getTime() - this.lastTooltipTime
    }

    // Public method to manually show tooltip
    public showTooltip(): void {
        if (this.isShowingTooltip || !HandTracking || !Hints) return

        // Get current hand position for tooltip placement
        const hoverPos = HandTracking.getHoverWorldPosition() ||
            HandTracking.getPinchPosition()

        if (!hoverPos) {
            print("EmptySpaceTapDetector: Cannot show tooltip - no hand position available")
            return
        }

        // Position tooltip slightly above hand
        const tooltipPos = hoverPos.add(new vec3(0, 5, 0))

        // Create tooltip using Hints.Dot
        this.tooltipHint = new Hints.Dot(tooltipPos, this.tooltipParent)

        // Show text tooltip as well
        Hints.showHandText(this.tooltipText, this.tooltipDuration)

        this.isShowingTooltip = true
        this.lastTooltipTime = getTime()

        // Auto-hide after duration
        this.scheduleTooltipHide()

        print(`EmptySpaceTapDetector: Showing tooltip: "${this.tooltipText}"`)
    }

    private scheduleTooltipHide(): void {
        if (!DoDelay) return

        if (this.handTextDelay) {
            this.handTextDelay.stop()
        }

        this.handTextDelay = new DoDelay(() => {
            this.hideTooltip()
        })
        this.handTextDelay.byTime(this.tooltipDuration)
    }

    // Public method to hide tooltip
    public hideTooltip(): void {
        if (!this.isShowingTooltip) return

        // Remove dot hint
        if (this.tooltipHint) {
            this.tooltipHint.remove()
            this.tooltipHint = null
        }

        // Hide hand text
        if (Hints) {
            Hints.hideHandText()
        }

        // Cancel scheduled hide
        if (this.handTextDelay) {
            this.handTextDelay.stop()
            this.handTextDelay = null
        }

        this.isShowingTooltip = false

        print("EmptySpaceTapDetector: Hiding tooltip")
    }

    // Public method to update tooltip text
    public setTooltipText(newText: string): void {
        this.tooltipText = newText

        // If currently showing tooltip, update it
        if (this.isShowingTooltip && Hints) {
            Hints.showHandText(this.tooltipText, this.tooltipDuration)
        }
    }

    // Public method to check if tooltip is currently visible
    public isTooltipShowing(): boolean {
        return this.isShowingTooltip
    }

    // Public method to force show tooltip regardless of cooldown
    public forceShowTooltip(): void {
        this.hideTooltip() // Hide any existing tooltip first
        this.showTooltip()
    }

    // Cleanup on destroy
    onDestroy() {
        // Remove event listeners
        if (HandTracking) {
            HandTracking.onPinchStart.remove(this.pinchStartHandler)
            HandTracking.onPinchEnd.remove(this.pinchEndHandler)
        }

        // Clean up timers
        if (this.handTextDelay) {
            this.handTextDelay.stop()
        }
        if (this.autoTooltipDelay) {
            this.autoTooltipDelay.stop()
        }

        // Hide tooltip
        this.hideTooltip()
    }
}