import {BaseState} from "./BaseState"
import {ApplicationModel} from "../ApplicationModel"
import {PinchButton} from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import {PersonalityQuizState} from "./PersonalityQuizState"

@component
export class FirstUserExperienceState extends BaseState {

    public static readonly STATE_NAME = "FirstUserExperience"

    @input()
    continueButton: PinchButton

    protected getStateName(): string {
        return FirstUserExperienceState.STATE_NAME
    }

    protected initializeUI(): void {
        print("FirstUserExperienceState initializeUI")
        if (this.continueButton) {
            print("PinchButton found: " + this.continueButton.getTypeName())
            print("Available properties: " + Object.getOwnPropertyNames(this.continueButton))

            if (this.continueButton.onButtonPinched) {
                this.continueButton.onButtonPinched.add(() => {
                    print("Continue button pinched - starting personality quiz")
                    ApplicationModel.instance.setFirstLaunchComplete()
                    this.sendSignal("START_QUIZ")
                })
            } else {
                print("Continue button doesn't have an onButtonPinched!")
            }
        } else {
            print("NO CONTINUE BUTTON!")
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: PersonalityQuizState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "START_QUIZ"
                },
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
