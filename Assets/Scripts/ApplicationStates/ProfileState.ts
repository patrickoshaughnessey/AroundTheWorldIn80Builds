import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { PersonalityQuizState } from "./PersonalityQuizState"
import { GoalDefinitionState } from "./GoalDefinitionState"
import { MenuState } from "./MenuState"
import {ContainerFrame} from "SpectaclesInteractionKit.lspkg/Components/UI/ContainerFrame/ContainerFrame";

@component
export class ProfileState extends BaseState {

    public static readonly STATE_NAME = "Profile"

    @input()
    personalityQuizButton: PinchButton

    @input()
    defineGoalsButton: PinchButton

    @input()
    containerFrame: ContainerFrame

    protected getStateName(): string {
        return ProfileState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.personalityQuizButton) {
            if (this.personalityQuizButton.onButtonPinched) {
                this.personalityQuizButton.onButtonPinched.add(() => {
                    print("Personality quiz button pinched - starting personality quiz")
                    this.sendSignal("START_PERSONALITY_QUIZ")
                })
            }
        }

        if (this.defineGoalsButton) {
            if (this.defineGoalsButton.onButtonPinched) {
                this.defineGoalsButton.onButtonPinched.add(() => {
                    print("Define goals button pinched - going to goal definition")
                    this.sendSignal("DEFINE_GOALS")
                })
            }
        }

        if (this.containerFrame && this.containerFrame.closeButton) {
            this.containerFrame.closeButton.onTrigger.add(() => {
                print("Close button pressed - returning to menu")
                this.sendSignal("GO_TO_MENU")
            });
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: PersonalityQuizState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "START_PERSONALITY_QUIZ"
                },
                onExecution: () => {
                    print("Transitioning from Profile to PersonalityQuiz")
                }
            },
            {
                nextStateName: GoalDefinitionState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "DEFINE_GOALS"
                },
                onExecution: () => {
                    print("Transitioning from Profile to GoalDefinition")
                }
            },
            {
                nextStateName: MenuState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "GO_TO_MENU"
                },
                onExecution: () => {
                    print("Transitioning from Profile to Menu")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Entering profile")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Exiting profile")
    }
}
