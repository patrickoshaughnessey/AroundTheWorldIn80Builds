import { InteractableOutlineFeedback } from "SpectaclesInteractionKit.lspkg/Components/Helpers/InteractableOutlineFeedback";

@component
export class OutlineFeedbackMeshCollector extends BaseScriptComponent {
    @input()
    outlineFeedback: InteractableOutlineFeedback;

    @input()
    rootObject: SceneObject;

    private findMeshesRecursive(currentObject: SceneObject, meshVisualsList: RenderMeshVisual[]): void {
        if (!currentObject) {
            return;
        }

        print("OutlineFeedbackMeshCollector: Searching on object : " + currentObject.name);
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

    private collectAndApplyMeshVisuals(): void {
        if (!this.outlineFeedback) {
            print("OutlineFeedbackMeshCollector: outlineFeedback component is not set. Cannot apply mesh visuals.");
            return;
        }

        if (!this.rootObject) {
            print("OutlineFeedbackMeshCollector: rootObject is null. Clearing mesh visuals from outlineFeedback.");
            this.outlineFeedback.meshVisuals = [];
            return;
        }

        print("OutlineFeedbackMeshCollector: Collecting mesh visuals.");
        const collectedMeshVisuals: RenderMeshVisual[] = [];
        this.findMeshesRecursive(this.rootObject, collectedMeshVisuals);

        this.outlineFeedback.meshVisuals = collectedMeshVisuals;
        print(`OutlineFeedbackMeshCollector: Applied ${collectedMeshVisuals.length} RenderMeshVisuals to InteractableOutlineFeedback.`);
    }

    public refreshMeshVisuals(): void {
        this.collectAndApplyMeshVisuals();
    }
}