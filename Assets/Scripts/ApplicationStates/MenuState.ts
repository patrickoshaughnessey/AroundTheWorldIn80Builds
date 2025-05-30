import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"

@component
export class MenuState extends BaseState {
    
    public static readonly STATE_NAME = "Menu"
    
    @input()
    profileButton: PinchButton

    @input()
    multiplayerButton: PinchButton

    protected getStateName(): string {
        return MenuState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.profileButton) {
            if (this.profileButton.onButtonPinched) {
                this.profileButton.onButtonPinched.add(() => {
                    print("Profile bu   tton pinched - starting personality quiz")
                    ApplicationModel.instance.setFirstLaunchComplete()
                    this.sendSignal("OPEN_PROFILE")
                })
            }
        }

        if (this.multiplayerButton) {
            if (this.multiplayerButton.onButtonPinched) {
                this.multiplayerButton.onButtonPinched.add(() => {
                    print("Multiplayer button pinched - starting multiplayer")
                    ApplicationModel.instance.setFirstLaunchComplete()
                    this.sendSignal("START_MULTIPLAYER")
                })
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                signal: "OPEN_PROFILE",
                nextStateName: "Profile", // Will update this once PersonalityQuizState is created
                onExecution: () => {
                    print("Transitioning from MenuState to Profile")
                }
            },
            {
                signal: "START_MULTIPLAYER",
                nextStateName: "Multiplayer",
                onExecution: () => {
                    print("Transitioning from MenuState to Multiplayer")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("MenuState")
    }

    protected onExitState(): void {
        super.onExitState()
        print("MenuState completed")
    }
}