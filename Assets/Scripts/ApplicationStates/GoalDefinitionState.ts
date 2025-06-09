import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { ProfileState } from "./ProfileState"
import { MenuState } from "./MenuState"
import { SpiritAnimalSpeechInput } from "../SpiritAnimalSpeechInput"
import { ContainerFrame } from "SpectaclesInteractionKit.lspkg/Components/UI/ContainerFrame/ContainerFrame"

@component
export class GoalDefinitionState extends BaseState {

    public static readonly STATE_NAME = "GoalDefinition"

    @input()
    promptTextDisplay: Text

    @input()
    goalTextDisplay: Text

    @input()
    restartGoalButton: PinchButton

    @input()
    submitGoalButton: PinchButton

    @input()
    containerFrame: ContainerFrame

    private speechInputService: SpiritAnimalSpeechInput

    private currentUserGoalText: string = ""
    private isListeningForGoal: boolean = false

    protected getStateName(): string {
        return GoalDefinitionState.STATE_NAME
    }

    protected initializeUI(): void {
        if (ApplicationModel.instance && ApplicationModel.instance.speechInputService) {
            this.speechInputService = ApplicationModel.instance.speechInputService
        } else {
            print("GoalDefinitionState: WARN - SpeechInputService not found in ApplicationModel!")
        }

        if (this.restartGoalButton && this.restartGoalButton.onButtonPinched) {
            this.restartGoalButton.onButtonPinched.add(this.restartGoal)
        } else {
            print("GoalDefinitionState: WARN - Restart Goal Button not assigned or no pinch event.")
        }

        if (this.submitGoalButton && this.submitGoalButton.onButtonPinched) {
            this.submitGoalButton.onButtonPinched.add(this.submitUserGoal)
        } else {
            print("GoalDefinitionState: WARN - Submit Goal Button not assigned or no pinch event.")
        }

        if (this.containerFrame && this.containerFrame.closeButton) {
            this.containerFrame.closeButton.onTrigger.add(() => {
                this.sendSignal("CANCEL_GOAL_DEFINITION")
            })
        } else {
            print("GoalDefinitionState: WARN - Container Frame or Close Button not assigned.")
        }
    }

    private startSpeechForGoal = () => {
        if (!this.speechInputService) {
            print("GoalDefinitionState: ERROR - SpeechInputService is not available for start.")
            if (this.goalTextDisplay) this.goalTextDisplay.text = "Speech service not ready."
            return
        }
        if (this.isListeningForGoal) {
            print("GoalDefinitionState: Already listening for goal.")
            return
        }

        print("GoalDefinitionState: Starting speech recognition for goal.")
        if (this.goalTextDisplay && this.currentUserGoalText === "") {
            this.goalTextDisplay.text = "Listening..."
        }

        // Removed clearing previous goal text to allow appending
        this.speechInputService.onTranscriptionReady = this.handleGoalTranscription
        this.speechInputService.startListening()
        this.isListeningForGoal = true
    }

    private restartGoal = () => {
        print("GoalDefinitionState: Restarting goal recording.")

        // Stop current listening session if active
        if (this.isListeningForGoal && this.speechInputService) {
            this.speechInputService.stopListening()
            this.isListeningForGoal = false
        }

        // Reset current goal text
        this.currentUserGoalText = ""

        // Update display
        if (this.goalTextDisplay) {
            this.goalTextDisplay.text = "Listening..."
        }

        // Restart voice recognition
        this.startSpeechForGoal()
    }

    private handleGoalTranscription = (transcription: string) => {
        print(`GoalDefinitionState: Goal transcription received: "${transcription}".`)

        // Append the new transcription to the current goal text instead of replacing it
        this.currentUserGoalText += (this.currentUserGoalText ? " " : "") + transcription

        if (this.goalTextDisplay) {
            // Display current goal with an indicator that we're still listening
            this.goalTextDisplay.text = this.currentUserGoalText + " 🎤"
        } else {
            print("GoalDefinitionState: WARN - goalTextDisplay not assigned.")
        }

        // Restart voice recognition automatically
        this.isListeningForGoal = false
        print("GoalDefinitionState: Goal transcription handled. Restarting voice recognition.")
        this.startSpeechForGoal()
    }

    private submitUserGoal = () => {
        if (this.currentUserGoalText.trim() === "") {
            print("GoalDefinitionState: WARN - Goal text is empty. Please record a goal before submitting.")
            if (this.goalTextDisplay) this.goalTextDisplay.text = "Please record your goal first"
            return 
        }

        if (!ApplicationModel.instance) {
            print("GoalDefinitionState: ERROR - ApplicationModel instance not found. Cannot save goal.")
            return
        }
        ApplicationModel.instance.saveUserGoal(this.currentUserGoalText)
        print("GoalDefinitionState: User goal submitted and saved.")

        // Transition to the next state, e.g., MenuState
        if (this.goalTextDisplay) this.goalTextDisplay.text = "Goal Saved!"
        this.sendSignal("GOAL_DEFINED_OPEN_MENU") // Example signal
    }

    private setButtonsInteractive(interactive: boolean): void {
        const buttons = [this.submitGoalButton, this.restartGoalButton];
        for (const button of buttons) {
            if (button && button.getSceneObject()) {
                button.getSceneObject().enabled = interactive;
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: MenuState.STATE_NAME, // Example: Go to Menu after goal definition
                checkOnSignal: (signal: string) => signal === "GOAL_DEFINED_OPEN_MENU",
                onExecution: () => print("Transitioning from GoalDefinition to Menu"),
            },
            {
                nextStateName: MenuState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "CANCEL_GOAL_DEFINITION",
                onExecution: () => print("Canceling goal definition and returning to Menu"),
            }
            // Add other transitions if needed (e.g., back to profile, etc.)
        ]
    }

    protected onEnterState(): void {
        super.onEnterState()
        print("GoalDefinitionState: Entering state.")
        this.currentUserGoalText = ""
        this.isListeningForGoal = false
        this.initializeUI()

        if (this.promptTextDisplay) {
            this.promptTextDisplay.text = "What is your main goal for this experience?"
        }

        // Display existing goal if any, otherwise prepare for recording
        const existingGoal = ApplicationModel.instance ? ApplicationModel.instance.getUserGoal() : null
        if (existingGoal) {
            if (this.goalTextDisplay) {
                this.goalTextDisplay.text = existingGoal
            }
            this.currentUserGoalText = existingGoal
        } else {
            // Automatically start speech recognition
            if (this.goalTextDisplay) {
                this.goalTextDisplay.text = "Listening..."
            }
            this.startSpeechForGoal()
        }

        this.setButtonsInteractive(true)
    }

    protected onExitState(): void {
        super.onExitState()
        print("GoalDefinitionState: Exiting state.")
        if (this.speechInputService) { 
            if (this.isListeningForGoal) {
                this.speechInputService.stopListening()
            }
            this.speechInputService.onTranscriptionReady = null 
            this.isListeningForGoal = false 
        }
        this.setButtonsInteractive(true)
    }
}
