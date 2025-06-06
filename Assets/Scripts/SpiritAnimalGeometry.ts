import { OutlineFeedbackMeshCollector } from "./OutlineFeedbackMeshCollector";

@component
export class SpiritAnimalController extends BaseScriptComponent {
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }

    onStart() {
        const meshCollector = this.findMeshCollectorInParent(this.getSceneObject());
        if (meshCollector) {
            meshCollector.refreshMeshVisuals();
        } else {
            print(">>> NO MESH COLLECTOR! <<< ")
        }
    }

    private findMeshCollectorInParent(currentObject: SceneObject) : OutlineFeedbackMeshCollector {
        if (!currentObject) {
            return null;
        }
        const meshCollector = currentObject.getComponent(OutlineFeedbackMeshCollector.getTypeName()) as OutlineFeedbackMeshCollector;
        if (meshCollector) {
            return meshCollector;
        }
        return this.findMeshCollectorInParent(currentObject.getParent());
    }
}
