import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {SyncEntity} from "SpectaclesSyncKit.lspkg/Core/SyncEntity"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo"
import {Headlock} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Headlock/Headlock"
import StateMachine from "SpectaclesInteractionKit.lspkg/Utils/StateMachine"
import {IdleState} from "./SpiritAnimalStates/IdleState"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {EventDispatcher} from "SpectaclesInteractionKit.lspkg/Utils/EventDispatcher"

// Define the event data type
interface SpiritAnimalEventData {
    senderId: string  // This will be the networkId
    timestamp: number
}

@component
export class SpiritAnimalController extends BaseScriptComponent {
    @input()
    manipulatable: InteractableManipulation

    @input()
    interactable: Interactable

    @input()
    headLock: Headlock

    @input()
    public stateDebugText: Text

    // Property to be set by the instantiator
    networkRootInfo: NetworkRootInfo

    // State machine for spirit animal behavior
    public spiritAnimalStateMachine: StateMachine

    syncEntity: SyncEntity

    private isMySpiritAnimal: boolean = false
    private networkId: string = ""
    

    onReady() {
        print("Spirit Animal Controller is ready");

        // Get the network ID from the networkRootInfo
        if (this.networkRootInfo) {
            this.networkId = this.networkRootInfo.networkId
            print("Spirit animal network ID: " + this.networkId)
        } else {
            print("Warning: No networkRootInfo available, using fallback ID")
            this.networkId = "fallback_" + Math.random().toString(36).substr(2, 9)
        }

        if (this.networkRootInfo && this.networkRootInfo.locallyCreated) {
            print("Animal belongs to me, I can move it")
            this.manipulatable.setCanTranslate(true)
            this.isMySpiritAnimal = true
        } else {
            print("Animal doesn't belong to me, I can't move it")
            this.manipulatable.setCanTranslate(false)
            this.headLock.enabled = false
            this.interactable.onTriggerStart.add(this.onOtherAnimalClicked)
        }

        // Start the state machine with the Idle state
        if (this.spiritAnimalStateMachine) {
            print("Starting spirit animal state machine with Idle state")
            this.spiritAnimalStateMachine.enterState(IdleState.STATE_NAME)
        } else {
            print("Error: Spirit animal state machine is not initialized")
        }

        this.stateDebugText = this.getSceneObject().getComponent("Component.Text") as Text
    }

    onAwake() {
        // Create new sync entity for this script
        this.syncEntity = new SyncEntity(this)

        print("SpiritAnimalController: syncEntity object: " + this.syncEntity)

        // Initialize the state machine
        this.spiritAnimalStateMachine = new StateMachine("SpiritAnimalBehavior")
        print("Spirit animal state machine initialized")

        // Check sync entity is ready before using it
        this.syncEntity.notifyOnReady(() => {
            print("SyncEntity is ready with networkRoot: " + this.syncEntity.networkRoot)
            this.onReady()
        })
    }

    // Clean up resources when destroyed
    onDestroy() {
        if (this.spiritAnimalStateMachine) {
            this.spiritAnimalStateMachine.destroy()
        }
    }
    
    private onOtherAnimalClicked = (e: InteractorEvent) => {
        print("Other animal clicked - sending global event")
        }
        
}