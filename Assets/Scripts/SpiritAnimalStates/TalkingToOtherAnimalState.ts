import { ApplicationModel } from "../ApplicationModel";
import { RealtimeDataService } from "../RealtimeDataService";
import { SpiritAnimalTTS } from "../SpiritAnimalTTS";
import { BaseSpiritAnimalState } from "./BaseSpiritAnimalState"
import { FlyingBackToOwnerState } from "./FlyingBackToOwnerState"
import { IdleState } from "./IdleState"

declare global {
    var DoDelay: any;
}

@component
export class TalkingToOtherAnimalState extends BaseSpiritAnimalState {

    public static readonly STATE_NAME = "TalkingToOtherAnimal"

    public getStateName(): string {
        return TalkingToOtherAnimalState.STATE_NAME
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: FlyingBackToOwnerState.STATE_NAME,
                checkOnSignal: (signal: string) => signal === "DONE_TALKING",
                onExecution: () => print("Transitioning from TalkingToOtherAnimal to FlyingBackToOwner")
            }
        ]
    }

    protected async onEnterState(): Promise<void> {
        super.onEnterState()
        print("Spirit animal is now talking to other animal")

        const interactionData = ApplicationModel.instance.currentInteractionData;
        if (!interactionData) {
            print("TalkingToOtherAnimalState: ERROR - No interaction data found!");
            this.sendSignal("DONE_TALKING");
            return;
        }

        const myNetworkId = this.spiritAnimalController.syncEntity.networkRoot.networkId;
        const isInitiator = myNetworkId === interactionData.initiatorAnimalNetworkId;

        if (isInitiator) {
            print("This animal is the initiator. Fetching data and asking OpenAI for compatibility.");

            const myData = RealtimeDataService.instance.getDataForUser(interactionData.initiatorID);
            const otherData = RealtimeDataService.instance.getDataForUser(interactionData.receiverID);

            if (!myData || !otherData) {
                print("TalkingToOtherAnimalState: ERROR - Could not retrieve data for one or both users.");
                this.sendSignal("DONE_TALKING");
                return;
            }

            const myProfile = `My personality is ${myData.primaryPersonalityColor} and ${myData.secondaryPersonalityColor}. My goal is: ${myData.userGoal}.`;
            const otherProfile = `The other animal's personality is ${otherData.primaryPersonalityColor} and ${otherData.secondaryPersonalityColor}. Their goal is: ${otherData.userGoal}.`;
            
            const prompt = `Based on the following two profiles, provide a short, fun, and friendly compatibility analysis in 1-2 sentences. Speak directly to me as if you are my spirit animal.
            My Profile: ${myProfile}
            Their Profile: ${otherProfile}`;
            
            print("TalkingToOtherAnimalState: Sending prompt to OpenAI: " + prompt);

            try {
                const compatibilityAnalysis = await ApplicationModel.instance.chatService.ask(prompt);
                if (compatibilityAnalysis) {
                    print("TalkingToOtherAnimalState: Compatibility analysis received: " + compatibilityAnalysis);
                    // Use the TTS service to speak the analysis
                    const ttsService = this.spiritAnimalController.getSceneObject().getComponent(SpiritAnimalTTS.getTypeName()) as SpiritAnimalTTS;
                    if (ttsService) {
                        await ttsService.generateAndPlaySpeech(compatibilityAnalysis);
                        // Since there's no direct callback, we'll use a delay before transitioning.
                        // This is a simple workaround. A more robust solution would involve
                        // the TTS service managing a completion callback.
                        new DoDelay(() => {
                            print("TTS assumed finished, transitioning back.");
                            this.sendSignal("DONE_TALKING");
                        }).byTime(5); // Adjust time as needed based on average speech length
                    } else {
                        print("TalkingToOtherAnimalState: ERROR - TTS Service not found!");
                        this.sendSignal("DONE_TALKING");
                    }
                } else {
                    print("TalkingToOtherAnimalState: ERROR - OpenAI returned an empty response.");
                    this.sendSignal("DONE_TALKING");
                }
            } catch (error) {
                print("TalkingToOtherAnimalState: ERROR - Exception during OpenAI call: " + error);
                this.sendSignal("DONE_TALKING");
            }

        } else {
            print("This animal is the receiver. Waiting for the initiator to finish.");
            // The receiver does nothing and waits for the interaction to end.
            // The initiator will signal the end of the interaction.
            // For now, we'll just transition back after a delay.
            new DoDelay(() => {
                this.sendSignal("DONE_TALKING");
            }).byTime(10); // Wait 10 seconds as a fallback
        }
    }

    protected onExitState(): void {
        super.onExitState()
        print("Spirit animal is no longer talking to other animal")
    }
}
