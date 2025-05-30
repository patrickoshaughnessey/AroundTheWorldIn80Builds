import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import {SessionController} from "SpectaclesSyncKit.lspkg/Core/SessionController";
import { MenuState } from "./MenuState";

@component
export class MultiplayerState extends BaseState {

    public static readonly STATE_NAME = "Multiplayer"

    @input()
    menuButton: PinchButton

    protected getStateName(): string {
        return MultiplayerState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.menuButton) {
            if (this.menuButton.onButtonPinched) {
                this.menuButton.onButtonPinched.add(() => {
                    print("Menu button pinched - returning to menu")
                    this.sendSignal("GO_TO_MENU")
                })
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: MenuState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "GO_TO_MENU"
                },
                onExecution: () => {
                    print("Transitioning from Multiplayer to Menu")
                }
            }
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()

        SessionController.getInstance().init()
        print("Entering multiplayer mode")
    }

    protected onExitState(): void {
        super.onExitState()
        print("Exiting multiplayer mode")
    }
}
