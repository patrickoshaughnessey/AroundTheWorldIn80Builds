import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingToOtherAnimalState } from "./FlyingToOtherAnimalState"
import { WaitingForOtherAnimalState } from "./WaitingForOtherAnimalState"

@component
export class IdleState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "Idle"

    protected getStateName(): string {
        return IdleState.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("IdleState: initializeState")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: FlyingToOtherAnimalState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "FLY_TO_ANIMAL"
                },
                onExecution: () => {
                    print("Transitioning from Idle to FlyingToOtherAnimal")
                }
            },
            {
                nextStateName: WaitingForOtherAnimalState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "RECEIVE_OTHER_ANIMAL"
                },
                onExecution: () => {
                    print("Transitioning from Idle to WaitingForOtherAnimal")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now idle")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer idle")
    }
}