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
    continueButton: PinchButton

    @input()
    personalityDisplayText: Text

    private readonly personalityDescriptions: {[key: string]: string} = {
        "Gold": "You are Gold (The Organizer)! Responsible, dependable, and you love structure.",
        "Blue": "You are Blue (The Harmonizer)! Compassionate, empathetic, and you value connection.",
        "Orange": "You are Orange (The Adventurer)! Energetic, spontaneous, and you thrive on excitement.",
        "Green": "You are Green (The Conceptualizer)! Curious, analytical, and you're driven by ideas.",
        "Default": "Your spirit is unique! Time to set some goals." // Fallback
    }

    protected getStateName(): string {
        return SpiritAnimalRevealState.STATE_NAME
    }

    protected initializeUI(): void {
        if (this.continueButton && this.continueButton.onButtonPinched) {
            this.continueButton.onButtonPinched.add(() => {
                print("Continue button pinched - transitioning to Goal Definition or Menu")
                this.sendSignal("DEFINE_GOALS")
                })
        } else {
            print("SpiritAnimalRevealState: WARN - Continue Button not assigned or no pinch event.")
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: MenuState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "OPEN_MENU",
                onExecution: () => print("Transitioning from SpiritAnimalReveal to Menu"),
            },
            {
                nextStateName: GoalDefinitionState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "DEFINE_GOALS",
                onExecution: () => print("Transitioning from SpiritAnimalReveal to GoalDefinition"),
                },
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("SpiritAnimalRevealState: Entering state.")
        this.initializeUI()

        let primaryColor: string | null = null
        let secondaryColor: string | null = null
        let displayText = ""

        if (ApplicationModel.instance) {
            primaryColor = ApplicationModel.instance.getPrimaryPersonalityColor()
            secondaryColor = ApplicationModel.instance.getSecondaryPersonalityColor()
        }

        if (primaryColor && secondaryColor) {
            displayText = `Primary Color: ${primaryColor}\nSecondary Color: ${secondaryColor}`
            print(`SpiritAnimalRevealState: Displaying personality - Primary: ${primaryColor}, Secondary: ${secondaryColor}`)
        } else {
            displayText = this.personalityDescriptions["Default"] // Fallback if colors not found
            print("SpiritAnimalRevealState: No valid primary/secondary colors found. Displaying default message.")
        }

        if (this.personalityDisplayText) {
            this.personalityDisplayText.text = displayText
        } else {
            print("SpiritAnimalRevealState: WARN - personalityDisplayText UI element not assigned in Inspector!")
        }
    }

    protected onExitState(): void {
        super.onExitState()
        print("SpiritAnimalRevealState: Exiting state.")
    }
}
