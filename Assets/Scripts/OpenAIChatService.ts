import { SpiritAnimalTTS } from "./SpiritAnimalTTS";

@component
export class OpenAIChatService extends BaseScriptComponent {
    @input()
    openAIAPIKey: string = "YOUR_OPENAI_API_KEY_HERE"; // !!! IMPORTANT: Replace with your actual key

    @input()
    textToSpeechService: SpiritAnimalTTS; // Reference to the TTS service

    private internetModule: InternetModule = require("LensStudio:InternetModule");
    private isProcessing: boolean = false;

    // System prompt to define the spirit animal's personality
    private systemPrompt: string = "You are a wise and friendly spirit animal. Keep your responses concise and helpful.";

    onAwake() {
        if (this.openAIAPIKey === "YOUR_OPENAI_API_KEY_HERE" || !this.openAIAPIKey) {
            print("OpenAIChatService: WARN - OpenAI API Key is not set!");
        }
        if (!this.textToSpeechService) {
            print("OpenAIChatService: WARN - TextToSpeechService is not assigned!");
        }
    }

    public async ask(userQuery: string): Promise<string | null> {
        if (this.isProcessing) {
            print("OpenAIChatService: Request already in progress.");
            return null;
        }
        if (!this.openAIAPIKey || this.openAIAPIKey === "YOUR_OPENAI_API_KEY_HERE") {
            print("OpenAIChatService: Error - OpenAI API Key is not set.");
            return null;
        }
        if (!userQuery) {
            print("OpenAIChatService: Error - User query is empty.");
            return null;
        }
        if (!this.textToSpeechService) {
            print("OpenAIChatService: Error - TextToSpeechService is not assigned. Cannot play response.");
            // Optionally, you could still return the text response without playing audio
            // return the text response after fetching it, but log a warning.
        }

        this.isProcessing = true;
        print('OpenAIChatService: Asking OpenAI: ' + userQuery);

        const requestPayload = {
            model: "gpt-3.5-turbo", // Or "gpt-4o-mini", "gpt-4", etc.
            messages: [
                {
                    role: "system",
                    content: this.systemPrompt,
                },
                {
                    role: "user",
                    content: userQuery,
                },
            ],
        };

        const request = new Request(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + this.openAIAPIKey,
                },
                body: JSON.stringify(requestPayload),
            }
        );

        try {
            const response = await this.internetModule.fetch(request);
            if (response.status === 200) {
                const responseData = await response.json();
                if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
                    const aiResponseText = responseData.choices[0].message.content;
                    print('OpenAIChatService: OpenAI Response: ' + aiResponseText);

                    if (this.textToSpeechService && aiResponseText) {
                        // this.textToSpeechService.generateAndPlaySpeech(aiResponseText);
                    } else if (!this.textToSpeechService) {
                        print("OpenAIChatService: WARN - TextToSpeechService not available to play response.");
                    }
                    return aiResponseText;
                } else {
                    print("OpenAIChatService: Error - Invalid response structure from OpenAI.");
                    return null;
                }
            } else {
                const errorBodyText = await response.text();
                print('OpenAIChatService: Error - OpenAI API request failed with status ' + response.status + ': ' + errorBodyText);
                return null;
            }
        } catch (error: any) {
            print('OpenAIChatService: Error - Exception during OpenAI API call: ' + error.message);
            return null;
        } finally {
            this.isProcessing = false;
        }
    }

    // Method to allow changing the system prompt if needed
    public setSystemPrompt(newPrompt: string) {
        this.systemPrompt = newPrompt;
        print('OpenAIChatService: System prompt updated to: "' + newPrompt + '"');
    }
} 