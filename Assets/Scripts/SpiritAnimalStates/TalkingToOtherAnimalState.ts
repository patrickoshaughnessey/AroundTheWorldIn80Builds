import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingBackToOwnerState } from "./FlyingBackToOwnerState"
import { IdleState } from "./IdleState"

@component
export class TalkingToOtherAnimalState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "TalkingToOtherAnimal"

    // Track whether this animal initiated the interaction or received it
    private initiatedInteraction: boolean = false

    onAwake(): void {
        super.onAwake()
    }

    protected getStateName(): string {
        return TalkingToOtherAnimalState.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("TalkingToOtherAnimalState: initializeState")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: FlyingBackToOwnerState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "DONE_TALKING" && this.initiatedInteraction
                },
                onExecution: () => {
                    print("Transitioning from TalkingToOtherAnimal to FlyingBackToOwner")
                }
            },
            {
                nextStateName: IdleState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "DONE_TALKING" && !this.initiatedInteraction
                },
                onExecution: () => {
                    print("Transitioning from TalkingToOtherAnimal to Idle")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now talking to other animal")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer talking to other animal")
    }
}
