import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { MenuState } from "./MenuState"
import { GoalDefinitionState } from "./GoalDefinitionState"
import { MultiplayerState } from "./MultiplayerState"

@component
export class SpiritAnimalRevealState extends BaseState {

    public static readonly STATE_NAME = "SpiritAnimalReveal"

    @input()
    mainMenuButton: PinchButton

    @input()
    goalDefinitionButton: PinchButton

    @input()
    multiplayerButton: PinchButton

    protected getStateName(): string {
        return SpiritAnimalRevealState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.mainMenuButton) {
            if (this.mainMenuButton.onButtonPinched) {
                this.mainMenuButton.onButtonPinched.add(() => {
                    print("Main menu button pinched - returning to main menu")
                    this.sendSignal("GO_TO_MAIN_MENU")
                })
            }
        }

        if (this.goalDefinitionButton) {
            if (this.goalDefinitionButton.onButtonPinched) {
                this.goalDefinitionButton.onButtonPinched.add(() => {
                    print("Goal definition button pinched - going to goal definition")
                    this.sendSignal("GO_TO_GOAL_DEFINITION")
                })
            }
        }

        if (this.multiplayerButton) {
            if (this.multiplayerButton.onButtonPinched) {
                this.multiplayerButton.onButtonPinched.add(() => {
                    print("Multiplayer button pinched - starting multiplayer")
                    this.sendSignal("START_MULTIPLAYER")
                })
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: MenuState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "GO_TO_MAIN_MENU"
                },
                onExecution: () => {
                    print("Transitioning from SpiritAnimalReveal to MainMenu")
                }
            },
            {
                nextStateName: GoalDefinitionState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "GO_TO_GOAL_DEFINITION"
                },
                onExecution: () => {
                    print("Transitioning from SpiritAnimalReveal to GoalDefinition")
                }
            },
            {
                nextStateName: MultiplayerState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "START_MULTIPLAYER"
                },
                onExecution: () => {
                    print("Transitioning from SpiritAnimalReveal to Multiplayer")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("Revealing spirit animal")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal reveal completed")
    }
}
