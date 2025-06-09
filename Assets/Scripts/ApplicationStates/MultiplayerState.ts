import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import {SessionController} from "SpectaclesSyncKit.lspkg/Core/SessionController";
import { MenuState } from "./MenuState";
import {ContainerFrame} from "SpectaclesInteractionKit.lspkg/Components/UI/ContainerFrame/ContainerFrame";

@component
export class MultiplayerState extends BaseState {

    public static readonly STATE_NAME = "Multiplayer"

    @input()
    containerFrame: ContainerFrame

    protected getStateName(): string {
        return MultiplayerState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.containerFrame && this.containerFrame.closeButton) {
            this.containerFrame.closeButton.onTrigger.add(() => {
                print("Menu button pinched - returning to menu")
                this.sendSignal("GO_TO_MENU")
            })
        } else {
            print("MultiplayerState: WARN - Container Frame or Close Button not assigned.")
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
