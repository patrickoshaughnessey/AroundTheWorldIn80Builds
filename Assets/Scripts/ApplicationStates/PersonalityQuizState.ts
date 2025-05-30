import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { SpiritAnimalRevealState } from "./SpiritAnimalRevealState"

@component
export class PersonalityQuizState extends BaseState {

    public static readonly STATE_NAME = "PersonalityQuiz"

    @input()
    completeButton: PinchButton

    protected getStateName(): string {
        return PersonalityQuizState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.completeButton) {
            if (this.completeButton.onButtonPinched) {
                this.completeButton.onButtonPinched.add(() => {
                    print("Complete button pinched - showing spirit animal reveal")
                    this.sendSignal("REVEAL_SPIRIT_ANIMAL")
                })
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: SpiritAnimalRevealState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "REVEAL_SPIRIT_ANIMAL"
                },
                onExecution: () => {
                    print("Transitioning from PersonalityQuiz to SpiritAnimalReveal")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Starting personality quiz")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Personality quiz completed")
    }
}
