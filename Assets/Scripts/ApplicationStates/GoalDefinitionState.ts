import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { ProfileState } from "./ProfileState"
import { MenuState } from "./MenuState"
import { SpiritAnimalSpeechInput } from "../SpiritAnimalSpeechInput"

@component
export class GoalDefinitionState extends BaseState {

    public static readonly STATE_NAME = "GoalDefinition"

    @input()
    promptTextDisplay: Text

    @input()
    goalTextDisplay: Text

    @input()
    startRecordGoalButton: PinchButton

    @input()
    stopRecordGoalButton: PinchButton

    @input()
    submitGoalButton: PinchButton

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

        if (this.startRecordGoalButton && this.startRecordGoalButton.onButtonPinched) {
            this.startRecordGoalButton.onButtonPinched.add(this.startSpeechForGoal)
        } else {
            print("GoalDefinitionState: WARN - Start Record Goal Button not assigned or no pinch event.")
        }

        if (this.stopRecordGoalButton && this.stopRecordGoalButton.onButtonPinched) {
            this.stopRecordGoalButton.onButtonPinched.add(this.stopSpeechForGoal)
        } else {
            print("GoalDefinitionState: WARN - Stop Record Goal Button not assigned or no pinch event.")
        }

        if (this.submitGoalButton && this.submitGoalButton.onButtonPinched) {
            this.submitGoalButton.onButtonPinched.add(this.submitUserGoal)
        } else {
            print("GoalDefinitionState: WARN - Submit Goal Button not assigned or no pinch event.")
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
        if (this.goalTextDisplay) this.goalTextDisplay.text = "Listening..."
        
        this.currentUserGoalText = "" // Clear previous goal text
        this.speechInputService.onTranscriptionReady = this.handleGoalTranscription
        this.speechInputService.startListening()
        this.isListeningForGoal = true
        // Consider disabling start button, enabling stop button
    }

    private stopSpeechForGoal = () => {
        if (!this.speechInputService) {
            print("GoalDefinitionState: ERROR - SpeechInputService is not available for stop.")
            return
        }
        if (this.isListeningForGoal) {
            print("GoalDefinitionState: Manually stopping speech recognition for goal.")
            this.speechInputService.stopListening()
            this.isListeningForGoal = false
            if (this.goalTextDisplay && this.currentUserGoalText === "") { 
                this.goalTextDisplay.text = "Stopped. Tap Start Record to try again."
            }
            // Consider enabling start button, disabling stop button
        } else {
            print("GoalDefinitionState: Not currently listening for goal, stop command ignored.")
        }
    }

    private handleGoalTranscription = (transcription: string) => {
        print(`GoalDefinitionState: Goal transcription received: "${transcription}".`)
        this.currentUserGoalText = transcription
        if (this.goalTextDisplay) {
            this.goalTextDisplay.text = transcription
        } else {
            print("GoalDefinitionState: WARN - goalTextDisplay not assigned.")
        }
        this.isListeningForGoal = false 
        print("GoalDefinitionState: Goal transcription handled. isListeningForGoal is now false.")
        // Consider enabling start button, disabling stop button
    }

    private submitUserGoal = () => {
        if (this.currentUserGoalText.trim() === "") {
            print("GoalDefinitionState: WARN - Goal text is empty. Please record a goal before submitting.")
            if (this.goalTextDisplay) this.goalTextDisplay.text = "Please record your goal first!"
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

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: MenuState.STATE_NAME, // Example: Go to Menu after goal definition
                checkOnSignal: (signal: string) => signal === "GOAL_DEFINED_OPEN_MENU",
                onExecution: () => print("Transitioning from GoalDefinition to Menu"),
            },
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
        if (this.goalTextDisplay) {
            // Display existing goal if any, or prompt to record
            const existingGoal = ApplicationModel.instance ? ApplicationModel.instance.getUserGoal() : null
            if (existingGoal) {
                this.goalTextDisplay.text = existingGoal
                this.currentUserGoalText = existingGoal
            } else {
                this.goalTextDisplay.text = "Tap Start Record to define your goal..."
            }
        }
        // Consider managing button visibility/interactivity here (e.g., disable stop, enable start)
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
    }
}
