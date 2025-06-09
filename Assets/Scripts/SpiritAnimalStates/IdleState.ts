import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingToMeetingLocation } from "./FlyingToMeetingLocation"

@component
export class IdleState extends BaseSpiritAnimalState {

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

        if (this.spiritAnimalController.headLock) {
            this.spiritAnimalController.headLock.enabled = this.isMyAnimal();
        }

        if (this.spiritAnimalController.manipulatable && this.isMyAnimal()) {
            this.spiritAnimalController.manipulatable.enabled = true;
        }
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer idle")
    }
}