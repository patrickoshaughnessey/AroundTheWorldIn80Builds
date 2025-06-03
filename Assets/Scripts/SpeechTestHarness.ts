import { ApplicationModel } from "./ApplicationModel";
import {PinchButton} from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";

@component
export class SpeechTestHarness extends BaseScriptComponent {
    // --- Speech and AI Components ---
    @input()
    testButton: PinchButton

    @input
    chatDisplayLabel: Text; // For displaying the conversation, initialized to null

    private isChatting: boolean = false; // To prevent multiple interactions while processing

    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
    }

    onStart() {
        if (this.testButton && this.testButton.onButtonPinched) {
                this.testButton.onButtonPinched.add(() => {
                    this.testSpeech()
                })
        } else {
            print("NO CONTINUE BUTTON!")
        }
        // Assign transcription callback here, now that speechInputService should be populated by Instantiator
        if (ApplicationModel.instance.speechInputService) {
            ApplicationModel.instance.speechInputService.onTranscriptionReady = this.handleTranscriptionReady;
            print("SpeechTestHarness: onTranscriptionReady callback assigned in onReady.");
        } else {
            print("SpeechTestHarness: WARN - SpeechInputService still not assigned in onReady. Transcription callback cannot be set.");
        }

    }

    private testSpeech(){
        if (this.isChatting) {
            print("SpeechTestHarness: Already processing a chat interaction.");
            return;
        }

        print("SpeechTestHarness: Interaction detected. Starting chat flow.");
        this.isChatting = true;
        if (this.chatDisplayLabel) {
            this.chatDisplayLabel.text = "Listening...";
        }
        print("SpeechTestHarness: Calling speechInputService.startListening()");
        ApplicationModel.instance.speechInputService.startListening();
    };

    private handleTranscriptionReady = async (transcription: string) => {
        if (!transcription) {
            print("SpeechTestHarness: Received empty transcription.");
            if (this.chatDisplayLabel) {
                this.chatDisplayLabel.text = "Sorry, I didn't catch that.";
            }
            this.isChatting = false;
            return;
        }

        print("SpeechTestHarness: Transcription ready: " + transcription);
        if (this.chatDisplayLabel) {
            this.chatDisplayLabel.text = "You: " + transcription;
        }

            if (this.chatDisplayLabel) {
                this.chatDisplayLabel.text += "\nThinking...";
            }
            const aiResponse = await ApplicationModel.instance.chatService.ask(transcription);
            if (aiResponse) {
                print("SpeechTestHarness: AI Response: " + aiResponse);
                if (this.chatDisplayLabel) {
                    this.chatDisplayLabel.text = "You: " + transcription + "\nAI: " + aiResponse;
                }
            } else {
                print("SpeechTestHarness: No response from AI.");
                if (this.chatDisplayLabel) {
                    this.chatDisplayLabel.text = "You: " + transcription + "\nAI: I'm not sure how to respond right now.";
                }
            }
        this.isChatting = false;
    };

    onDestroy() {
        // NO-OP
    }
}
