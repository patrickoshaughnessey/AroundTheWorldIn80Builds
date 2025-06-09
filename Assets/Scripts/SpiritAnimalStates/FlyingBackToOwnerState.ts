import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { IdleState } from "./IdleState"

declare global {
    var DoDelay: any;
}

@component
export class FlyingBackToOwnerState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "SAFlyingBackToOwner"

    public getStateName(): string {
        return FlyingBackToOwnerState.STATE_NAME
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: IdleState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "ARRIVED_AT_OWNER",
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

        // Simulate flight time with a delay
        new DoDelay(() => {
            print("Spirit animal has arrived back at owner");
            this.sendSignal("ARRIVED_AT_OWNER");
        }).byTime(3); // 3-second flight
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer flying back to owner")
    }
}
