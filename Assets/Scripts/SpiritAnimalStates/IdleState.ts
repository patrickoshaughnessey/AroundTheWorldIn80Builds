import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingToMeetingLocation } from "./FlyingToMeetingLocation"

@component
export class IdleState extends BaseSpiritAnimalState {
    protected initializeState(): void {
    }

    public static readonly STATE_NAME = "SAIdle"

    public getStateName(): string {
        return IdleState.STATE_NAME
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: FlyingToMeetingLocation.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "FLY_TO_MEETING_LOCATION",
                onExecution: () => {
                    print("Transitioning from Idle to FlyingToMeetingLocation")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now idle")

        if (this.controller.headLock) {
            this.controller.headLock.enabled = this.isMyAnimal();
        }

        if (this.controller.manipulatable && this.isMyAnimal()) {
            this.controller.manipulatable.enabled = true;
        }
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer idle")
    }
}