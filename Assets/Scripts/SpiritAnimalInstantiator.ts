import {Instantiator} from "SpectaclesSyncKit.lspkg/Components/Instantiator"
import {InstantiationOptions} from "SpectaclesSyncKit.lspkg/Components/Instantiator"
import {SyncEntity} from "SpectaclesSyncKit.lspkg/Core/SyncEntity"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo"
import {SpiritAnimalController} from "./SpiritAnimalController"

@component
export class SpiritAnimalInstantiator extends BaseScriptComponent {
    @input()
    instantiator: Instantiator

    @input()
    spiritAnimalPrefab: ObjectPrefab

    @input()
    aiServicesHolder: SceneObject

    syncEntity: SyncEntity
    sceneObj: SceneObject

    spawn(prefab: ObjectPrefab) {        
        if (this.instantiator.isReady()) {
            print("Spawning " + prefab.name);   
            // Spawn piece using the Sync Framework instantiator, set local start position
            const options = new InstantiationOptions()
            options.localPosition = new vec3(10,10,-10)
            this.instantiator.instantiate(
                prefab,
                options,
                // onSuccess
                (networkRootInfo: NetworkRootInfo) => {
                    print("networkRootINfo: " + networkRootInfo)
                    const newObj = networkRootInfo.instantiatedObject;
                    print('instantiated new object: ' + newObj)

                    // Find the SpiritAnimalController component and set its networkRootInfo
                    const controller = newObj.getComponent(SpiritAnimalController.getTypeName()) as SpiritAnimalController;

                    if (controller) {
                        print("Found SpiritAnimalController, setting networkRootInfo")
                        controller.networkRootInfo = networkRootInfo;
                    } else {
                        print("Could not find SpiritAnimalController on instantiated object")
                    }
                }
            );            
        } else {
            print("Instantiator isn't ready!")
        }
    }

    onReady() {
        print("Spirit Animal Instantiator is ready");
        if (this.instantiator.isReady()) {
            print("Instantiator is ready... calling spawn");
            this.spawn(this.spiritAnimalPrefab)
        } else {
            this.instantiator.notifyOnReady(() => {
                print("Instantiator notified it is ready... calling spawn")
                this.spawn(this.spiritAnimalPrefab)   
            })
        }
    }

    onAwake() {
        // Create new sync entity for this script
        this.syncEntity = new SyncEntity(this)

        print("SpiritAnimalInstantiator: syncEntity object: " + this.syncEntity)
        //
        // Check sync entity is ready before using it        
        this.syncEntity.notifyOnReady(() => this.onReady())
    }
}
