import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { TalkingToOtherAnimalState } from "./TalkingToOtherAnimalState"
import {ApplicationModel} from "../ApplicationModel";

@component
export class FlyingToMeetingLocation extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "SAFlyingToMeetingLocation"
    
    private movementSpeed: number = 0; // Will be calculated once on enter

    private GAP = 2.0;

    public getStateName(): string {
        return FlyingToMeetingLocation.STATE_NAME
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: TalkingToOtherAnimalState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "ARRIVED_AT_MEETING_LOCATION",
                onExecution: () => {
                    print(`Animal (${this.spiritAnimalController?.syncEntity?.networkId}): Transitioning from FlyingToMeetingLocation to TalkingToOtherAnimal`)
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState();
        print(`Animal (${this.spiritAnimalController?.syncEntity?.networkId}): Spirit animal is now flying to meeting location`);
        
        // Disable headlock and manipulatable while flying
        if (this.spiritAnimalController.headLock) {
            this.spiritAnimalController.headLock.enabled = false;
        }
        
        if (this.spiritAnimalController.manipulatable) {
            this.spiritAnimalController.manipulatable.enabled = false;
        }

        // Calculate movement speed once based on initial distance
        const interactionData = ApplicationModel.instance.currentInteractionData;
        if (interactionData && this.spiritAnimalController && this.spiritAnimalController.manipulatable && this.isMyAnimal()) {
            const manipulatableTransform = this.spiritAnimalController.manipulatable.getSceneObject().getTransform();
            const currentPosition = manipulatableTransform.getWorldPosition();
            const targetPosition = interactionData.meetingLocation;
            const initialDistance = targetPosition.sub(currentPosition).length - this.GAP;
            
            const maxTravelTime = 3.0; // seconds
            const minSpeed = 2.0; // minimum speed to avoid too slow movement for short distances
            this.movementSpeed = Math.max(initialDistance / maxTravelTime, minSpeed);
            
            print(`Animal (${this.spiritAnimalController.syncEntity.networkId}): Initial distance: ${initialDistance.toFixed(2)}, Movement speed: ${this.movementSpeed.toFixed(2)}`);
        }
    }

    protected onUpdateState(): void {
        super.onUpdateState();
        const interactionData = ApplicationModel.instance.currentInteractionData;
        if (interactionData != null) {
            if (!this.spiritAnimalController || !this.spiritAnimalController.manipulatable) {
                return;
            }

            // Only move the animal if we own it
            if (!this.isMyAnimal()) {
                return; // This animal doesn't belong to us, don't move it
            }

            // Move the manipulatable transform instead of the geometry
            const manipulatableTransform = this.spiritAnimalController.manipulatable.getSceneObject().getTransform();
            const currentPosition = manipulatableTransform.getWorldPosition();
            const targetPosition = interactionData.meetingLocation;
        
            // Calculate movement
            const direction = targetPosition.sub(currentPosition);
            const distance = direction.length - this.GAP;
    
            // Check if we've reached the target (increased threshold so they stop further away)
            const arrivalThreshold = 0.1;
            if (distance <= arrivalThreshold) {
                // Arrived at meeting location - billboard face the meeting point (Y-axis only)
                const lookDirection = direction.normalize();
                if (lookDirection.length > 0.01) {
                    // Create Y-axis only rotation (billboard style)
                    const flatDirection = new vec3(lookDirection.x, 0, lookDirection.z).normalize();
                    const finalRotation = quat.lookAt(flatDirection, vec3.up());
                    manipulatableTransform.setWorldRotation(finalRotation);
                }
            
                print(`Animal (${this.spiritAnimalController.syncEntity.networkId}): Arrived at meeting location`);
                this.sendSignal("ARRIVED_AT_MEETING_LOCATION");
                return;
            }
            
            const deltaTime = getDeltaTime();
    
            // Calculate new position using the fixed speed
            const normalizedDirection = direction.normalize();
            const moveDistance = Math.min(this.movementSpeed * deltaTime, distance);
            const newPosition = currentPosition.add(normalizedDirection.uniformScale(moveDistance));
    
            // Apply movement to manipulatable transform
            manipulatableTransform.setWorldPosition(newPosition);
    
            // Calculate and apply rotation to face movement direction (Y-axis only)
            if (direction.length > 0.01) { // Only rotate if we're actually moving
                // Create Y-axis only rotation (billboard style) for movement
                const flatDirection = new vec3(normalizedDirection.x, 0, normalizedDirection.z).normalize();
                const targetRotation = quat.lookAt(flatDirection, vec3.up());
        
                // Smoothly interpolate to the target rotation for smoother turning
                const rotationSpeed = 5.0; // Adjust rotation speed as needed
                const currentRotation = manipulatableTransform.getWorldRotation();
                const newRotation = quat.slerp(currentRotation, targetRotation, rotationSpeed * deltaTime);
        
                manipulatableTransform.setWorldRotation(newRotation);
            }
        }
    }

    protected onExitState(): void {
        super.onExitState();
        print(`Animal (${this.spiritAnimalController?.syncEntity?.networkId}): Spirit animal is no longer flying to meeting location`);
    }
}