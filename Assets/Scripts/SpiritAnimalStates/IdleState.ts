import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingToMeetingLocation } from "./FlyingToMeetingLocation"

@component
export class IdleState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "SAIdle"

    protected getStateName(): string {
        return IdleState.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("IdleState: initializeUI")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: FlyingToMeetingLocation.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "FLY_TO_MEETING_LOCATION"
                },
                onExecution: () => {
                    print("Transitioning from Idle to FlyingToMeetingLocation")
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