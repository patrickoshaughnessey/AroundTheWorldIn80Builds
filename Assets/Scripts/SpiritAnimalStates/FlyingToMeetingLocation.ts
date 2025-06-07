import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { TalkingToOtherAnimalState } from "./TalkingToOtherAnimalState"

@component
export class FlyingToMeetingLocation extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "SAFlyingToMeetingLocation"

    onAwake(): void {
        super.onAwake()
    }

    protected getStateName(): string {
        return FlyingToMeetingLocation.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("FlyingToMeetingLocation: initializeState")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: TalkingToOtherAnimalState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "ARRIVED_AT_MEETING_LOCATION"
                },
                onExecution: () => {
                    print("Transitioning from FlyingToMeetingLocation to TalkingToOtherAnimal")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now flying to meet another animal")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer flying to another animal")
    }
}
