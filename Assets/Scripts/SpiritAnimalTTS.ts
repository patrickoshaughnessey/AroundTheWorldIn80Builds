// Declare AudioTrackAsset and AudioOutputProvider if used
declare var AudioTrackAsset: any; // Or more specific type if known
declare var AudioOutputProvider: any; // For audioOutputTrack.control

@component
export class SpiritAnimalTTS extends BaseScriptComponent {

    @input()
    openAIAPIKey: string = "YOUR_OPENAI_API_KEY_HERE"; // !!! IMPORTANT: Replace with your actual key

    @input()
    audioOutputAsset: Asset; // Assign an "Audio Output" asset from your project here

    // @input() // Removed @input() to make it truly optional at the framework level
    debugTextOutput: Text | null = null; // Initialize to null

    private audioComponent: AudioComponent;
    private internetModule: InternetModule = require("LensStudio:InternetModule");
    private isProcessing: boolean = false;

    // Default voice and model, can be customized
    // See OpenAI TTS documentation for available voices and models
    // https://platform.openai.com/docs/guides/text-to-speech
    private ttsVoice: string = "alloy"; 
    private ttsModel: string = "tts-1"; // Can also be tts-1-hd for higher quality
    private readonly pcmSampleRate = 24000; // OpenAI TTS PCM output sample rate

    onAwake() {
        this.audioComponent = this.getSceneObject().getComponent("AudioComponent") as AudioComponent;
        if (!this.audioComponent) {
            this.audioComponent = this.getSceneObject().createComponent("AudioComponent") as AudioComponent;
            print("SpiritAnimalTTS: Created AudioComponent.");
        }

        // These checks will now only print to console if debugTextOutput happens to be assigned by other means (e.g. another script)
        // Or if you manually assign it in onAwake by finding a scene object by name.
        if (!this.audioOutputAsset && this.debugTextOutput) { 
            this.debugTextOutput.text = "TTS WARN: Audio Output Asset not set";
        }
        print("SpiritAnimalTTS: WARN - Audio Output Asset is not assigned! Check Inspector."); // Always print this to console if not set

        if ((this.openAIAPIKey === "YOUR_OPENAI_API_KEY_HERE" || !this.openAIAPIKey) && this.debugTextOutput) {
            this.debugTextOutput.text = "TTS WARN: API Key not set";
        }
        // The script continues to function without debugTextOutput for its core audio task.
    }

    public async generateAndPlaySpeech(textToSpeak: string) {
        if (!this.audioOutputAsset) {
            print("SpiritAnimalTTS: Error - Audio Output Asset is not assigned. Cannot play speech.");
            // Ensure this critical check happens before trying to use debugTextOutput which might be null
            if (this.debugTextOutput) this.debugTextOutput.text = "TTS ERROR: No Audio Output Asset";
            return;
        }
        if (this.isProcessing) return;
        if (!this.openAIAPIKey || this.openAIAPIKey === "YOUR_OPENAI_API_KEY_HERE" || !textToSpeak || !this.audioComponent) {
            print("SpiritAnimalTTS: Error - Pre-flight check failed (API Key, text, or AudioComponent missing).");
            if (this.debugTextOutput) this.debugTextOutput.text = "TTS ERROR: Preflight Fail";
            return;
        }

        this.isProcessing = true;
        if (this.debugTextOutput) this.debugTextOutput.text = "TTS: Generating PCM...";
        print('SpiritAnimalTTS: Generating speech for: "' + textToSpeak + '" using PCM format.');

        const requestPayload = {
            model: this.ttsModel,
            input: textToSpeak,
            voice: this.ttsVoice,
            response_format: "pcm", // Requesting PCM format
            sample_rate: this.pcmSampleRate // Explicitly request sample rate for pcm
        };

        const request = new Request(
            "https://api.openai.com/v1/audio/speech",
            {
                method: "POST",
                headers: {
                    "Authorization": 'Bearer ' + this.openAIAPIKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestPayload),
            }
        );

        try {
            const response = await this.internetModule.fetch(request);
            if (response.status === 200) {
                const audioDataBytes = await response.bytes(); // Returns Uint8Array for PCM
                if (audioDataBytes && audioDataBytes.length > 0) {
                    print("SpiritAnimalTTS: PCM audio data received, length: " + audioDataBytes.length);
                    if (this.debugTextOutput) this.debugTextOutput.text = "TTS: Got PCM, Processing...";
                    
                    const audioTrack = this.getAudioTrackFromPCMData(audioDataBytes);
                    this.audioComponent.audioTrack = audioTrack;
                    this.audioComponent.play(1); 

                    print("SpiritAnimalTTS: Play command issued for PCM track.");
                    if (this.debugTextOutput) this.debugTextOutput.text = "TTS: Playing";
                } else {
                    print("SpiritAnimalTTS: Error - Received empty PCM audio data.");
                    if (this.debugTextOutput) this.debugTextOutput.text = "TTS ERROR: Empty PCM data";
                }
            } else {
                const errorBodyText = await response.text(); 
                print('SpiritAnimalTTS: Error - OpenAI TTS API request failed with status ' + response.status + ': ' + errorBodyText);
                if (this.debugTextOutput) this.debugTextOutput.text = "TTS ERROR: " + response.status;
            }
        } catch (error: any) {
            print('SpiritAnimalTTS: Error - Exception during OpenAI TTS API call: ' + error.message + (error.stack ? ("\nStack: " + error.stack) : ""));
            if (this.debugTextOutput) this.debugTextOutput.text = "TTS EXC: " + error.message.substring(0,20);
        } finally {
            this.isProcessing = false;
        }
    }

    private getAudioTrackFromPCMData = (audioDataPCM: Uint8Array): AudioTrackAsset => {
        let outputAudioTrack = this.audioOutputAsset as AudioTrackAsset;
        if (!outputAudioTrack) {
            // This case should be caught by the check at the start of generateAndPlaySpeech
            // but as a safeguard if this method were called directly elsewhere:
            print("SpiritAnimalTTS: CRITICAL - Failed to get Audio Output asset in getAudioTrackFromPCMData.");
            if (this.debugTextOutput) this.debugTextOutput.text = "TTS CRITICAL: No Audio Asset for PCM";
            throw new Error("SpiritAnimalTTS: Failed to get Audio Output asset in getAudioTrackFromPCMData.");
        }

        // audioDataPCM is Int16 (2 bytes per sample). Length is total bytes.
        const numSamples = audioDataPCM.length / 2; 
        if (this.debugTextOutput) this.debugTextOutput.text = "TTS Proc: Samples " + numSamples;
        print("SpiritAnimalTTS: Processing PCM numSamples: " + numSamples);

        var audioOutput = outputAudioTrack.control as AudioOutputProvider;
        if (!audioOutput) {
            if (this.debugTextOutput) this.debugTextOutput.text = "TTS ERROR: No Audio Provider";
            throw new Error("SpiritAnimalTTS: Failed to get audio output control from Audio Output Asset.");
        }

        audioOutput.sampleRate = this.pcmSampleRate;
        var float32Data = new Float32Array(numSamples);

        // Convert PCM16 (signed 16-bit, little-endian from OpenAI) to Float32 array
        for (let i = 0; i < numSamples; i++) {
            let byte1 = audioDataPCM[i * 2];
            let byte2 = audioDataPCM[i * 2 + 1];
            // Combine to form a 16-bit signed integer (little-endian)
            let intSample = (byte2 << 8) | byte1;
            // Sign-extend if negative (if byte2 is > 127)
            if (intSample >= 32768) { // 0x8000
                intSample -= 65536; // 0x10000
            }
            float32Data[i] = intSample / 32768.0;
        }
        
        print("SpiritAnimalTTS: PCM data converted to Float32. Min: " + Math.min(...float32Data) + " Max: " + Math.max(...float32Data));

        const frameSize = audioOutput.getPreferredFrameSize();
        print("SpiritAnimalTTS: AudioOutputProvider preferred frame size: " + frameSize);
        let currentPosition = 0;
        while (currentPosition < numSamples) {
            try {
                const chunkSize = Math.min(frameSize, numSamples - currentPosition);
                // Create a shape for the current chunk. enqueueAudioFrame expects vec3 for shape.
                const shape = new vec3(chunkSize, 1, 1); 
                
                audioOutput.enqueueAudioFrame(float32Data.subarray(currentPosition, currentPosition + chunkSize), shape);
                currentPosition += chunkSize;
            } catch (e: any) {
                if (this.debugTextOutput) this.debugTextOutput.text = "TTS ERROR: Enqueue Fail";
                throw new Error("SpiritAnimalTTS: Failed to enqueue audio frame - " + e.message + " at position " + currentPosition);
            }
        }
        print("SpiritAnimalTTS: All PCM data enqueued.");
        if (this.debugTextOutput) this.debugTextOutput.text = "TTS: PCM Processed";
        return outputAudioTrack;
    };

    // Method to allow changing TTS voice and model if needed
    public setTTSVoice(voice: string) {
        this.ttsVoice = voice;
    }
    public setTTSModel(model: string) {
        this.ttsModel = model;
    }
} 