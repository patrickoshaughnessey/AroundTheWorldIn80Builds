import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {SyncEntity} from "SpectaclesSyncKit.lspkg/Core/SyncEntity"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo"
import {Headlock} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Headlock/Headlock"
import StateMachine from "SpectaclesInteractionKit.lspkg/Utils/StateMachine"
import {IdleState} from "./SpiritAnimalStates/IdleState"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {Instantiator} from "../SpectaclesSyncKit.lspkg/Components/Instantiator";
import {InstantiationOptions} from "SpectaclesSyncKit.lspkg/Components/Instantiator";
import {SessionController} from "../SpectaclesSyncKit.lspkg/Core/SessionController";

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

    @input()
    public modelInstantiator: Instantiator

    @input
    private spiritAnimalPrefabs: ObjectPrefab[] = []

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

            // We now instantiate the geometry for our animal
            if (SessionController.getInstance().isHost()) {
                // TODO: Instantiate the right animal based upon our personality. for now, spawn spiritanimal.gold.blue for host
                this.spawnSpiritAnimal("spiritanimal.gold.blue")
            } else {
                // TODO: Instantiate the right animal based upon our personality. for now, spawn spiritanimal.gold.orange for guest
                this.spawnSpiritAnimal("spiritanimal.gold.orange")
            }
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

    private spawnSpiritAnimalWhenReady(animalNamed: string) {
        if (this.modelInstantiator.isReady()) {
            this.spawnSpiritAnimal(animalNamed)
        } else {
            print("Instantiator is not ready to instantiate the animal geometry")
            this.modelInstantiator.notifyOnReady(() => {
                this.spawnSpiritAnimal(animalNamed)
            })
        }
    }

    private findMeshesRecursive(currentObject: SceneObject, meshVisualsList: RenderMeshVisual[]): void {
        if (!currentObject) {
            return;
        }

        const meshVisuals = currentObject.getComponents("RenderMeshVisual") as RenderMeshVisual[];
        if (meshVisuals) {
            for (const meshVisual of meshVisuals) {
                meshVisualsList.push(meshVisual);
            }
        }

        const childrenCount = currentObject.getChildrenCount();
        for (let i = 0; i < childrenCount; i++) {
            const child = currentObject.getChild(i);
            this.findMeshesRecursive(child, meshVisualsList);
        }
    }

    private spawnSpiritAnimal(animalNamed: string) {
        print("Instantiating animal geometry");
        for (const prefab of this.spiritAnimalPrefabs) {
            if (animalNamed === prefab.name) {
                const options = new InstantiationOptions();
                options.localScale = new vec3(2, 2, 2);
                this.modelInstantiator.instantiate(
                    prefab,
                    options,
                    // onSuccess
                    (networkRootInfo: NetworkRootInfo) => {
                        print("spirit animal model networkRootInfo: " + networkRootInfo);
                        const newObj = networkRootInfo.instantiatedObject;
                        print('instantiated spirit animal model: ' + newObj);
                    }
                );
            }
        }
    }
}