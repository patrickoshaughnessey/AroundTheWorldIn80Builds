import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingBackToOwnerState } from "./FlyingBackToOwnerState"
import { IdleState } from "./IdleState"
import { ApplicationModel } from "../ApplicationModel"
import { RealtimeDataService, UserSpiritAnimalData } from "../RealtimeDataService"

@component
export class TalkingToOtherAnimalState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "TalkingToOtherAnimal"

    // Track whether this animal initiated the interaction or received it
    private initiatedInteraction: boolean = false
    private isAnalyzing: boolean = false // Prevent multiple analyses

    public getStateName(): string {
        return TalkingToOtherAnimalState.STATE_NAME
    }

    protected initializeState(): void {
        // Initialize any UI elements specific to this state
        print("TalkingToOtherAnimalState: initializeState")
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: FlyingBackToOwnerState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "DONE_TALKING"
                },
                onExecution: () => {
                    print("Transitioning from TalkingToOtherAnimal to FlyingBackToOwner")
                }
            },
            {
                nextStateName: IdleState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "FLY_BACK_HOME",
                onExecution: () => {
                    print("Transitioning from TalkingToOtherAnimal to Idle for receiver")
                }
            }
        ]
    }

    protected async onEnterState(): Promise<void> {
        super.onEnterState()
        print("Spirit animal is now in TalkingToOtherAnimalState")

        if (this.isAnalyzing) {
            print("TalkingToOtherAnimalState: Analysis already in progress. Aborting.")
            return
        }

        const interactionData = ApplicationModel.instance.currentInteractionData
        if (!interactionData) {
            print("TalkingToOtherAnimalState: ERROR - No interaction data found. Aborting and returning to owner.")
            this.controller.spiritAnimalStateMachine.sendSignal("DONE_TALKING")
            return
        }

        // Determine if this animal is the initiator
        this.initiatedInteraction = (interactionData.initiatorID === RealtimeDataService.instance.getLocalUserId())
        print(`TalkingToOtherAnimalState: Am I the initiator? ${this.initiatedInteraction}`)

        // Only the initiator performs the compatibility check
        if (this.initiatedInteraction) {
            this.isAnalyzing = true

            const initiatorData = RealtimeDataService.instance.getDataForUser(interactionData.initiatorID)
            const receiverData = RealtimeDataService.instance.getDataForUser(interactionData.receiverID)

            if (!initiatorData || !receiverData) {
                print("TalkingToOtherAnimalState: ERROR - Could not retrieve data for one or both users.")
                this.isAnalyzing = false
                this.controller.spiritAnimalStateMachine.sendSignal("DONE_TALKING")
                return
            }

            const prompt = this.constructCompatibilityPrompt(initiatorData, receiverData)
            print(`TalkingToOtherAnimalState: Sending compatibility prompt to OpenAI.`)

            try {
                const compatibilityResult = await ApplicationModel.instance.chatService.ask(prompt)
                if (compatibilityResult) {
                    print(`TalkingToOtherAnimalState: Compatibility result received: ${compatibilityResult}`)
                    ApplicationModel.instance.compatibilityAnalysisResult = compatibilityResult;
                    // Use TTS to speak the result
                    const ttsService = ApplicationModel.instance.chatService.textToSpeechService
                    if (ttsService) {
                        print("TalkingToOtherAnimalState: TTS for compatibility result is currently disabled.")
                        // ttsService.generateAndPlaySpeech(compatibilityResult)
                    }
                } else {
                    print("TalkingToOtherAnimalState: WARN - Compatibility analysis returned empty.")
                }
            } catch (error: any) {
                print(`TalkingToOtherAnimalState: ERROR - Exception during compatibility analysis: ${error.message}`)
            } finally {
                this.isAnalyzing = false
                // Wait a moment after speaking before flying back
                new DoDelay(() => {
                    if (this.controller) {
                        this.controller.spiritAnimalStateMachine.sendSignal("DONE_TALKING")
                    }
                }).byTime(5.0) // 5 second delay to allow for speech
            }
        } else {
            // If we are the receiver, we just wait a bit and then go home.
            // A more advanced implementation could have us listen for the result to be spoken.
            new DoDelay(() => {
                if (this.controller) {
                    this.controller.spiritAnimalStateMachine.sendSignal("FLY_BACK_HOME") // A different signal for receivers
                }
            }).byTime(10.0) // Wait for 10 seconds
        }
    }

    private constructCompatibilityPrompt(user1: UserSpiritAnimalData, user2: UserSpiritAnimalData): string {
        let prompt = "Given the information about these two people, analyze their compatibility, unique aspects and provide a detailed information how their interaction will be. Your tone should match with the personality of the users\n\n"
        
        prompt += `User 1 Data:\n`
        prompt += `Primary Color: ${user1.primaryPersonalityColor || 'N/A'}\n`
        prompt += `Secondary Color: ${user1.secondaryPersonalityColor || 'N/A'}\n`
        prompt += `Stated Goal: ${user1.userGoal || 'Not specified'}\n\n`

        prompt += `User 2 Data:\n`
        prompt += `Primary Color: ${user2.primaryPersonalityColor || 'N/A'}\n`
        prompt += `Secondary Color: ${user2.secondaryPersonalityColor || 'N/A'}\n`
        prompt += `Stated Goal: ${user2.userGoal || 'Not specified'}\n\n`

        return prompt
    }

    protected onExitState(): void {
        super.onExitState()
        this.isAnalyzing = false // Ensure flag is reset on exit
        print("Spirit animal is no longer talking to other animal")
    }
}
