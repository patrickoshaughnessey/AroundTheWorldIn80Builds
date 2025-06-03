import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {SyncEntity} from "SpectaclesSyncKit.lspkg/Core/SyncEntity"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo"
import {Headlock} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Headlock/Headlock";

@component
export class SpiritAnimalController extends BaseScriptComponent {        
    manipulatable: InteractableManipulation = null; // Initialize to null

    headLock: Headlock = null; // Initialize to null

    networkRootInfo: NetworkRootInfo
    syncEntity: SyncEntity
    sceneObj: SceneObject

    onReady() {
        print("SpiritAnimalController: onReady triggered.");    

        // Attempt to self-assign Manipulatable component if not already set
        if (!this.manipulatable && this.sceneObj) {
            try {
                const foundManipulatable = this.sceneObj.getComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
                if (foundManipulatable) {
                    this.manipulatable = foundManipulatable;
                    print("SpiritAnimalController: Successfully self-assigned Manipulatable component in onReady.");
                } else {
                    print("SpiritAnimalController: WARN - Could not find/self-assign Manipulatable component in onReady. Manipulation might not work.");
                    // Decide if this is fatal. For now, proceeding without it.
                }
            } catch (e: any) {
                print("SpiritAnimalController: ERROR trying to self-assign Manipulatable in onReady: " + e.message);
            }
        }

        // Attempt to self-assign Headlock component if not already set
        if (!this.headLock && this.sceneObj) {
            try {
                const foundHeadlock = this.sceneObj.getComponent(Headlock.getTypeName()) as Headlock;
                if (foundHeadlock) {
                    this.headLock = foundHeadlock;
                    print("SpiritAnimalController: Successfully self-assigned Headlock component in onReady.");
                } else {
                    print("SpiritAnimalController: WARN - Could not find/self-assign Headlock component in onReady. Headlock might not work.");
                }
            } catch (e: any) {
                print("SpiritAnimalController: ERROR trying to self-assign Headlock in onReady: " + e.message);
            }
        }


        if (this.networkRootInfo && this.networkRootInfo.locallyCreated) {
            print("Animal belongs to me, I can move it.");
            if (this.manipulatable) this.manipulatable.setCanTranslate(true);
            else print("SpiritAnimalController: Manipulatable component missing, cannot enable translation.");
        } else {
            print("Animal doesn't belong to me, I can't move it.");
            if (this.manipulatable) this.manipulatable.setCanTranslate(false);
            if (this.headLock) this.headLock.enabled = false;
            else print("SpiritAnimalController: Headlock component missing, cannot disable it for non-local animal.");
        }
    }

    onAwake() {
       this.sceneObj = this.getSceneObject(); 

       // Initial attempt to get Manipulatable in onAwake
       if (!this.manipulatable && this.sceneObj) { 
           try {
                const foundManipulatable = this.sceneObj.getComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
                if (foundManipulatable) {
                    this.manipulatable = foundManipulatable;
                    print("SpiritAnimalController: Successfully self-assigned Manipulatable component in onAwake.");
                }
           } catch (e:any) {
               print("SpiritAnimalController: ERROR trying to self-assign Manipulatable in onAwake: " + e.message);
           }
       }

       // Initial attempt to get Headlock in onAwake
       if (!this.headLock && this.sceneObj) { 
           try {
                const foundHeadlock = this.sceneObj.getComponent(Headlock.getTypeName()) as Headlock;
                if (foundHeadlock) {
                    this.headLock = foundHeadlock;
                    print("SpiritAnimalController: Successfully self-assigned Headlock component in onAwake.");
                }
           } catch (e:any) {
               print("SpiritAnimalController: ERROR trying to self-assign Headlock in onAwake: " + e.message);
           }
       }

       this.syncEntity = new SyncEntity(this)
       print("SpiritAnimalController: syncEntity object: " + this.syncEntity + " for scene object: " + this.sceneObj.name);
       this.syncEntity.notifyOnReady(() => {
           print("SyncEntity is ready with networkRoot: " + this.syncEntity.networkRoot)
           this.onReady(); // Call onReady after syncEntity has processed network info
       })

    }


    onDestroy() {
        // No cleanup needed
    }
}
