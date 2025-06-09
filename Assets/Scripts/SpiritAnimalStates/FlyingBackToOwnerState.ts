import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { IdleState } from "./IdleState"
import { ApplicationModel } from "../ApplicationModel"

declare global {
    var DoDelay: any;
}

@component
export class FlyingBackToOwnerState extends BaseSpiritAnimalState {
    @input
    public gptOutputText: Text;

    @input
    public readButton: ScreenTransform;

    private movementSpeed: number = 2.0; // Default speed, can be adjusted.
    private GAP = 2.0;

    protected initializeState(): void {
        if (this.readButton) {
            this.readButton.getSceneObject().enabled = false;
        }
        if (this.gptOutputText) {
            this.gptOutputText.getSceneObject().enabled = false;
        }
    }

    public static readonly STATE_NAME = "SAFlyingBackToOwner"

    public getStateName(): string {
        return FlyingBackToOwnerState.STATE_NAME
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: IdleState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "READ_BUTTON_CLICKED",
                onExecution: () => {
                    print("Transitioning from FlyingBackToOwner to Idle")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Spirit animal is now flying back to owner")

        // Disable manipulation while flying
        if (this.controller.manipulatable) {
            this.controller.manipulatable.enabled = false;
        }

        // The "owner" position is the world origin, or where the head is tracked.
        // For simplicity, we can use the head binding's position if available, otherwise origin.
        const ownerTransform = this.controller.headLock ? this.controller.headLock.getSceneObject().getTransform() : null;
        const targetPosition = ownerTransform ? ownerTransform.getWorldPosition() : vec3.zero();

        // Calculate movement speed based on initial distance
        if (this.controller && this.controller.manipulatable) {
            const manipulatableTransform = this.controller.manipulatable.getSceneObject().getTransform();
            const currentPosition = manipulatableTransform.getWorldPosition();
            const initialDistance = targetPosition.sub(currentPosition).length;

            const maxTravelTime = 3.0; // seconds
            const minSpeed = 2.0; // minimum speed
            this.movementSpeed = Math.max(initialDistance / maxTravelTime, minSpeed);
            print(`FlyingBackToOwner: Initial distance to owner: ${initialDistance.toFixed(2)}, Movement speed: ${this.movementSpeed.toFixed(2)}`);
        }
    }

    protected onUpdateState(): void {
        super.onUpdateState();

        if (!this.controller || !this.controller.manipulatable) {
            return;
        }
        
        // Only move the animal if we own it
        if (!this.isMyAnimal()) {
            return; 
        }

        const manipulatableTransform = this.controller.manipulatable.getSceneObject().getTransform();
        const currentPosition = manipulatableTransform.getWorldPosition();
        
        // The owner is the target
        const ownerTransform = this.controller.headLock ? this.controller.headLock.getSceneObject().getTransform() : null;
        const targetPosition = ownerTransform ? ownerTransform.getWorldPosition() : vec3.zero();

        const direction = targetPosition.sub(currentPosition);
        const distance = direction.length - this.GAP;

        // Check if we've arrived
        const arrivalThreshold = 0.1;
        if (distance <= arrivalThreshold) {
            this.onArrivedAtOwner();
            return;
        }

        const deltaTime = getDeltaTime();
        const normalizedDirection = direction.normalize();
        const moveDistance = Math.min(this.movementSpeed * deltaTime, distance);
        const newPosition = currentPosition.add(normalizedDirection.uniformScale(moveDistance));

        manipulatableTransform.setWorldPosition(newPosition);

        if (direction.length > 0.01) {
            const flatDirection = new vec3(normalizedDirection.x, 0, normalizedDirection.z).normalize();
            const targetRotation = quat.lookAt(flatDirection, vec3.up());
            const rotationSpeed = 5.0;
            const currentRotation = manipulatableTransform.getWorldRotation();
            const newRotation = quat.slerp(currentRotation, targetRotation, rotationSpeed * deltaTime);
            manipulatableTransform.setWorldRotation(newRotation);
        }
    }

    private onArrivedAtOwner(): void {
        print("Spirit animal has arrived back at owner");
        
        // Display GPT output and "Read" button
        if (this.gptOutputText) {
            this.gptOutputText.text = ApplicationModel.instance.compatibilityAnalysisResult || "No analysis available.";
            this.gptOutputText.getSceneObject().enabled = true;
        }
        if (this.readButton) {
            this.readButton.getSceneObject().enabled = true;
        }

        // Re-enable headlock so it sticks to the user
        if (this.controller.headLock) {
            this.controller.headLock.enabled = true;
        }

        // Stop calling onUpdateState by sending a signal that does nothing in the state machine for now.
        // The real transition will happen on button click.
        this.sendSignal("ARRIVED_AT_OWNER"); // This signal is now for internal logic, not transition
    }


    public onReadButtonClick(): void {
        print("Read button clicked!");
        this.sendSignal("READ_BUTTON_CLICKED");
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer flying back to owner")

        // Hide UI elements
        if (this.gptOutputText) {
            this.gptOutputText.getSceneObject().enabled = false;
        }
        if (this.readButton) {
            this.readButton.getSceneObject().enabled = false;
        }

        // Re-enable manipulation for the next state
        if (this.controller.manipulatable) {
            this.controller.manipulatable.enabled = true;
        }

        // Clear the analysis result after it has been read
        ApplicationModel.instance.compatibilityAnalysisResult = null;
    }
}
