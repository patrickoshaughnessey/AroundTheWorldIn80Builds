import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { IdleState } from "./IdleState"
import { LensConfig } from "SpectaclesInteractionKit.lspkg/Utils/LensConfig"
import { DispatchedDelayedEvent } from "SpectaclesInteractionKit.lspkg/Utils/UpdateDispatcher"

@component
export class FlyingBackToOwnerState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "FlyingBackToOwner"

    private delayedEvent: DispatchedDelayedEvent

    onAwake(): void {
        super.onAwake()
        this.delayedEvent = LensConfig.getInstance().updateDispatcher.createDelayedEvent()
        this.delayedEvent.bind(() => {
            print("Spirit animal has arrived back at owner")
            this.sendSignal("ARRIVED_AT_OWNER")
        })
    }

    protected getStateName(): string {
        return FlyingBackToOwnerState.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("FlyingBackToOwnerState: initializeState")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: IdleState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "ARRIVED_AT_OWNER"
                },
                onExecution: () => {
                    print("Transitioning from FlyingBackToOwner to Idle")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now flying back to owner")

        // In a real implementation, you would start an animation or movement here
        // For now, we'll just simulate arrival after a delay
        this.delayedEvent.reset(2.0) // 2 second delay
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer flying back to owner")
    }
}
