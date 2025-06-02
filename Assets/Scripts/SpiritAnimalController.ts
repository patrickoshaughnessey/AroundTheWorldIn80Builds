import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {SyncEntity} from "SpectaclesSyncKit.lspkg/Core/SyncEntity"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo"
import {Headlock} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Headlock/Headlock"
import StateMachine from "SpectaclesInteractionKit.lspkg/Utils/StateMachine"
import {IdleState} from "./SpiritAnimalStates/IdleState"

@component
export class SpiritAnimalController extends BaseScriptComponent {        
    @input()
    manipulatable: InteractableManipulation

    @input()
    headLock: Headlock

    // Property to be set by the instantiator
    networkRootInfo: NetworkRootInfo

    // State machine for spirit animal behavior
    public spiritAnimalStateMachine: StateMachine

    syncEntity: SyncEntity
    sceneObj: SceneObject

    onReady() {
        print("Spirit Animal Controller is ready");    

        if (this.networkRootInfo && this.networkRootInfo.locallyCreated) {
            print("Animal belongs to me, I can move it")
            this.manipulatable.setCanTranslate(true)
        } else {
            // Spirit animal belongs to the other player, so I can't move it
            print("Animal doesn't belong to me, I can't' move it")
            this.manipulatable.setCanTranslate(false)
            this.headLock.enabled = false
        }

        // Start the state machine with the Idle state
        if (this.spiritAnimalStateMachine) {
            print("Starting spirit animal state machine with Idle state")
            this.spiritAnimalStateMachine.enterState(IdleState.STATE_NAME)
        } else {
            print("Error: Spirit animal state machine is not initialized")
        }
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
}
