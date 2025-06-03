import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { IdleState } from "./IdleState"

@component
export class FlyingBackToOwnerState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "SAFlyingBackToOwner"

    onAwake(): void {
        super.onAwake()
        // this.delayedEvent = LensConfig.getInstance().updateDispatcher.createDelayedEvent()
        // this.delayedEvent.bind(() => {
        //     print("Spirit animal has arrived back at owner")
        //     this.sendSignal("ARRIVED_AT_OWNER")
        // })
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
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer flying back to owner")
    }
}
