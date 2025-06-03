import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { TalkingToOtherAnimalState } from "./TalkingToOtherAnimalState"
import { LensConfig } from "SpectaclesInteractionKit.lspkg/Utils/LensConfig"
import { DispatchedDelayedEvent } from "SpectaclesInteractionKit.lspkg/Utils/UpdateDispatcher"

@component
export class FlyingToOtherAnimalState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "SAFlyingToOtherAnimal"

    private delayedEvent: DispatchedDelayedEvent

    onAwake(): void {
        super.onAwake()
        // this.delayedEvent = LensConfig.getInstance().updateDispatcher.createDelayedEvent()
        // this.delayedEvent.bind(() => {
        //     print("Spirit animal has arrived at other animal")
        //     this.sendSignal("ARRIVED_AT_OTHER_ANIMAL")
        // })
    }

    protected getStateName(): string {
        return FlyingToOtherAnimalState.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("FlyingToOtherAnimalState: initializeState")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: TalkingToOtherAnimalState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "ARRIVED_AT_OTHER_ANIMAL"
                },
                onExecution: () => {
                    print("Transitioning from FlyingToOtherAnimal to TalkingToOtherAnimal")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now flying to other animal")

        // In a real implementation, you would start an animation or movement here
        // For now, we'll just simulate arrival after a delay
        this.delayedEvent.reset(2.0) // 2 second delay
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer flying to other animal")
    }
}
