import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingBackToOwnerState } from "./FlyingBackToOwnerState"
import { IdleState } from "./IdleState"
import { FlyingToMeetingLocation } from "./FlyingToMeetingLocation"
import { SpiritAnimalController } from "../SpiritAnimalController"
import { DispatchedDelayedEvent } from "SpectaclesInteractionKit.lspkg/Utils/UpdateDispatcher"

@component
export class TalkingToOtherAnimalState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "TalkingToOtherAnimal"

    // Track whether this animal initiated the interaction or received it
    private initiatedInteraction: boolean = false

    private delayedEvent: DispatchedDelayedEvent

    onAwake(): void {
        super.onAwake()
        // this.delayedEvent = LensConfig.getInstance().updateDispatcher.createDelayedEvent()
        // this.delayedEvent.bind(() => {
        //     print("Spirit animal has finished talking")
        //     this.sendSignal("DONE_TALKING")
        // })
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

        // Determine if this animal initiated the interaction or received it
        // by checking the previous state
        const controller = this.getSceneObject().getComponent(SpiritAnimalController.getTypeName()) as SpiritAnimalController
        if (controller && controller.spiritAnimalStateMachine) {
            const previousState = controller.spiritAnimalStateMachine.previousState?.name
            this.initiatedInteraction = previousState === FlyingToMeetingLocation.STATE_NAME
            print(`Spirit animal ${this.initiatedInteraction ? 'initiated' : 'received'} the interaction`)
        }

        // In a real implementation, you would start a conversation animation here
        // For now, we'll just simulate the conversation ending after a delay
        this.delayedEvent.reset(3.0) // 3 second delay
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer talking to other animal")
    }
}
