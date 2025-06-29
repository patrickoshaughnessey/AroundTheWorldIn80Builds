// Declare VoiceMLModule and its related types if not globally available
declare var VoiceMLModule: any; 
declare var VoiceML: {
    ListeningOptions: { // Changed from ListeningOptionsFactory
        create: () => any; // Let options be 'any' for now to bypass strict property checks
    };
    ListeningUpdateEventArgs: any; 
};

@component
export class SpiritAnimalSpeechInput extends BaseScriptComponent {
    private voiceMLModule: VoiceMLModule = require("LensStudio:VoiceMLModule");
    private isListening: boolean = false;
    public onTranscriptionReady: (transcription: string, isFinal: boolean) => void;

    // @input() // Removed decorator
    debugTextOutput: Text = null; // Initialize to null

    // Store the cookie/registration object returned by .add()
    private listeningUpdateCookie: any = null;

    onAwake() {
        if (!this.voiceMLModule) {
            print("SpiritAnimalSpeechInput: FATAL - VoiceMLModule not found!");
            return;
        }
        this.voiceMLModule.onListeningEnabled.add(() => {
            // print("SpiritAnimalSpeechInput: VoiceML system service is enabled.");
        });
    }

    public startListening() {
        print("SpiritAnimalSpeechInput: startListening() called.");
        if (this.isListening) {
            print("SpiritAnimalSpeechInput: Already listening.");
            return;
        }
        if (!this.voiceMLModule) { 
            print("SpiritAnimalSpeechInput: VoiceML module not loaded.");
            if(this.debugTextOutput) this.debugTextOutput.text = "STT: Module Missing";
            return;
        }

        print("SpiritAnimalSpeechInput: Attempting to start voice listening...");
        if(this.debugTextOutput) this.debugTextOutput.text = "STT: Listening...";

        let options: any = VoiceML.ListeningOptions.create(); // Changed from VoiceML.ListeningOptionsFactory
        options.shouldReturnAsrTranscription = true;
        options.shouldReturnInterimAsrTranscription = true; 
        
        // Remove previous listener by its cookie if it exists, before adding a new one.
        if (this.listeningUpdateCookie) {
            this.voiceMLModule.onListeningUpdate.remove(this.listeningUpdateCookie);
            this.listeningUpdateCookie = null; // Clear old cookie
        }
        this.listeningUpdateCookie = this.voiceMLModule.onListeningUpdate.add(this.onListenUpdate);
        
        print("SpiritAnimalSpeechInput: About to call this.voiceMLModule.startListening(options)");
        this.voiceMLModule.startListening(options);
        this.isListening = true;
    }

    public stopListening() {
        if (!this.isListening || !this.voiceMLModule) {
            if(this.debugTextOutput && !this.isListening) this.debugTextOutput.text = "STT: Idle";
            return;
        }
        print("SpiritAnimalSpeechInput: Stopping voice listening.");
        if(this.debugTextOutput) this.debugTextOutput.text = "STT: Idle";

        this.voiceMLModule.stopListening();
        if (this.listeningUpdateCookie) {
            this.voiceMLModule.onListeningUpdate.remove(this.listeningUpdateCookie);
            this.listeningUpdateCookie = null;
        }
        this.isListening = false;
    }

    private onListenUpdate = (eventData: VoiceML.ListeningUpdateEventArgs) => { 
        if (eventData.transcription) {
            if (this.onTranscriptionReady) {
                this.onTranscriptionReady(eventData.transcription, eventData.isFinalTranscription);
            } else {
                print("SpiritAnimalSpeechInput: WARN - onTranscriptionReady was not assigned! Cannot send transcription.");
            }
        }
    };

    onDestroy() {
        if (this.listeningUpdateCookie) {
            this.voiceMLModule.onListeningUpdate.remove(this.listeningUpdateCookie);
            this.listeningUpdateCookie = null;
        }
        if (this.voiceMLModule && this.isListening) {
            this.voiceMLModule.stopListening();
            this.isListening = false;
        }
    }
} 