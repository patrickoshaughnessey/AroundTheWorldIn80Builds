import { BaseState } from "./BaseState"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { ProfileState } from "./ProfileState"
import {MenuState} from "./MenuState";

@component
export class GoalDefinitionState extends BaseState {

    public static readonly STATE_NAME = "GoalDefinition"

    @input()
    saveButton: PinchButton

    @input()
    cancelButton: PinchButton

    protected getStateName(): string {
        return GoalDefinitionState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.saveButton) {
            if (this.saveButton.onButtonPinched) {
                this.saveButton.onButtonPinched.add(() => {
                    print("Save button pinched - saving goals and returning to profile")
                    this.sendSignal("SAVE_GOALS")
                })
            }
        }

        if (this.cancelButton) {
            if (this.cancelButton.onButtonPinched) {
                this.cancelButton.onButtonPinched.add(() => {
                    print("Cancel button pinched - returning to profile without saving")
                    this.sendSignal("CANCEL_GOALS")
                })
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: MenuState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "SAVE_GOALS"
                },
                onExecution: () => {
                    print("Transitioning from GoalDefinition to Profile (after saving)")
                }
            },
            {
                nextStateName: ProfileState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "CANCEL_GOALS"
                },
                onExecution: () => {
                    print("Transitioning from GoalDefinition to Profile (after canceling)")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Entering goal definition")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Exiting goal definition")
    }
}
