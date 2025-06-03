import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { TalkingToOtherAnimalState } from "./TalkingToOtherAnimalState"
import { LensConfig } from "SpectaclesInteractionKit.lspkg/Utils/LensConfig"
import { DispatchedDelayedEvent } from "SpectaclesInteractionKit.lspkg/Utils/UpdateDispatcher"

@component
export class WaitingForOtherAnimalState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "WaitingForOtherAnimal"

    private delayedEvent: DispatchedDelayedEvent

    onAwake(): void {
        super.onAwake()
        // this.delayedEvent = LensConfig.getInstance().updateDispatcher.createDelayedEvent()
        // this.delayedEvent.bind(() => {
        //     print("Other animal has arrived")
        //     this.sendSignal("OTHER_ANIMAL_ARRIVED")
        // })
    }

    protected getStateName(): string {
        return WaitingForOtherAnimalState.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("WaitingForOtherAnimalState: initializeState")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: TalkingToOtherAnimalState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "OTHER_ANIMAL_ARRIVED"
                },
                onExecution: () => {
                    print("Transitioning from WaitingForOtherAnimal to TalkingToOtherAnimal")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now waiting for other animal")

        // In a real implementation, you would wait for a network event or other trigger
        // For now, we'll just simulate the other animal arriving after a delay
        this.delayedEvent.reset(2.0) // 2 second delay
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer waiting for other animal")
    }
}
