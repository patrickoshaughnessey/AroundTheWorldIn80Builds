import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"

@component
export class FirstUserExperienceState extends BaseState {
    
    public static readonly STATE_NAME = "FirstUserExperience"
    
    @input()
    continueButton: PinchButton

    protected getStateName(): string {
        return FirstUserExperienceState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.continueButton) {
            print("PinchButton found: " + this.continueButton.getTypeName())
            print("Available properties: " + Object.getOwnPropertyNames(this.continueButton))
        
            if (this.continueButton.onButtonPinched) {
                this.continueButton.onButtonPinched.add(() => {
                    print("Continue button pinched - starting personality quiz")
                    ApplicationModel.instance.setFirstLaunchComplete()
                    this.sendSignal("START_QUIZ")
                })
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                signal: "START_QUIZ",
                nextStateName: "PersonalityQuiz", // Will update this once PersonalityQuizState is created
                onExecution: () => {
                    print("Transitioning from FirstUserExperience to PersonalityQuiz")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Welcome! This is your first time using the app")
    }

    protected onExitState(): void {
        super.onExitState()
        print("First user experience completed")
    }
}