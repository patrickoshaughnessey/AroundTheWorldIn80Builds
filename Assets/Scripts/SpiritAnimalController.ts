import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {SyncEntity} from "SpectaclesSyncKit.lspkg/Core/SyncEntity"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo"

@component
export class SpiritAnimalController extends BaseScriptComponent {        
    @input()
    manipulatable: InteractableManipulation

    // Property to be set by the instantiator
    networkRootInfo: NetworkRootInfo

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
        }
    }

    onAwake() {
        // Create new sync entity for this script
       this.syncEntity = new SyncEntity(this)

       print("SpiritAnimalController: syncEntity object: " + this.syncEntity)

       // Check sync entity is ready before using it
       this.syncEntity.notifyOnReady(() => {
           print("SyncEntity is ready with networkRoot: " + this.syncEntity.networkRoot)
           this.onReady()
       })
    }
}
