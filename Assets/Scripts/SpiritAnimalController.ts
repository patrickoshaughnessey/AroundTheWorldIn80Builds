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
import {ApplicationModel} from "./ApplicationModel";

// Define the event data type
interface SpiritAnimalEventData {
    senderId: string  // This will be the networkId
    timestamp: number
}

export interface InteractionData {
    initiatorID: string;
    receiverID: string;
    initiatorAnimalNetworkId: string;
    receiverAnimalNetworkId: string;
    meetingLocation: vec3
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

    @input()
    public spiritAnimalGeometryParent: SceneObject

    @input
    private spiritAnimalPrefabs: ObjectPrefab[] = []

    // State machine for spirit animal behavior
    public spiritAnimalStateMachine: StateMachine

    syncEntity: SyncEntity

    private isMySpiritAnimal: boolean = false

    onReady() {
        print("Spirit Animal Controller is ready");

        if (this.syncEntity.networkRoot && this.syncEntity.networkRoot.locallyCreated) {
            print("Animal belongs to me, I can move it, and my connection id is: " + SessionController.getInstance().getLocalConnectionId())

            this.manipulatable.setCanTranslate(true)
            this.isMySpiritAnimal = true
            ApplicationModel.instance.myAnimal = this.syncEntity.networkRoot;

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


    private onOtherAnimalClicked = (e: InteractorEvent) => {
        print("Other animal clicked: " + this.syncEntity.networkRoot + "  - sending global event");
        ApplicationModel.instance.lastClickedAnimal = this.syncEntity.networkRoot;

        // Calculate middle point between the two animals
        const myAnimalController = ApplicationModel.instance.myAnimal.instantiatedObject.getComponent(SpiritAnimalController.getTypeName()) as SpiritAnimalController;
        const myPosition = myAnimalController.spiritAnimalGeometryParent.getTransform().getWorldPosition();
        const clickedPosition = this.spiritAnimalGeometryParent.getTransform().getWorldPosition();

        const meetingPoint = new vec3(
            (myPosition.x + clickedPosition.x) / 2,
            (myPosition.y + clickedPosition.y) / 2,
            (myPosition.z + clickedPosition.z) / 2
        );

        print(`Meeting location calculated: ${meetingPoint.toString()}`);

        const interactionData: InteractionData = {
            initiatorID: ApplicationModel.instance.myAnimal.getOwnerId(),
            receiverID: this.syncEntity.networkRoot?.getOwnerId() || "",
            initiatorAnimalNetworkId: ApplicationModel.instance.myAnimal.networkId,
            receiverAnimalNetworkId: this.syncEntity.networkRoot?.networkId || "",
            meetingLocation: meetingPoint
        }

        print("Sending Interaction Data: " + JSON.stringify(interactionData));
        print("Animal (" + interactionData.initiatorAnimalNetworkId + ") with owner (" + interactionData.initiatorID +
            "): Initiating request to interact with: " + interactionData.receiverAnimalNetworkId + ", with owner (" + interactionData.receiverID + ")")

        this.syncEntity.sendEvent("interactionInitiated", interactionData)
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
            this.syncEntity.onEventReceived.add("interactionInitiated", (messageInfo) => {
                let interactionData = messageInfo.data as InteractionData;
                if (ApplicationModel.instance.myAnimal.networkId == interactionData.receiverAnimalNetworkId) {
                    print("Animal (" + this.syncEntity.networkRoot?.networkId + ") : Received request to interact from: " + interactionData.initiatorID)
                    this.spiritAnimalStateMachine.sendSignal("FLY_TO_MEETING_LOCATION", interactionData)
                }
                else if (ApplicationModel.instance.myAnimal.networkId == interactionData.initiatorAnimalNetworkId) {
                    print("Animal (" + this.syncEntity.networkRoot?.networkId + ") : Initiated request to interact with: " + interactionData.receiverID)
                    this.spiritAnimalStateMachine.sendSignal("FLY_TO_MEETING_LOCATION", interactionData)
                } else {
                    print(">>>> DIDN'T MATCH EITHER!!! <<<<. " + JSON.stringify(messageInfo.data) + ", " + ApplicationModel.instance.myAnimal.networkId + ", " + this.syncEntity.networkRoot?.networkId);
                }
            });

            this.onReady()
        })
    }

    // Clean up resources when destroyed
    onDestroy() {
        if (this.spiritAnimalStateMachine) {
            this.spiritAnimalStateMachine.destroy()
        }
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