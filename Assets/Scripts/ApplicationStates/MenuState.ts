import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { ProfileState } from "./ProfileState"
import { MultiplayerState } from "./MultiplayerState"

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
                    print("Profile button pinched - opening profile")
                    this.sendSignal("OPEN_PROFILE")
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
                nextStateName: ProfileState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "OPEN_PROFILE"
                },
                onExecution: () => {
                    print("Transitioning from MenuState to Profile")
                }
            },
            {
                nextStateName: MultiplayerState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "START_MULTIPLAYER"
                },
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