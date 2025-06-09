import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { SpiritAnimalRevealState } from "./SpiritAnimalRevealState"
import { SpiritAnimalSpeechInput } from "../SpiritAnimalSpeechInput"
import {ContainerFrame} from "SpectaclesInteractionKit.lspkg/Components/UI/ContainerFrame/ContainerFrame";
import {MenuState} from "./MenuState";

declare global {
    var DoDelay: any;
}

@component
export class PersonalityQuizState extends BaseState {

    public static readonly STATE_NAME = "PersonalityQuiz"

    @input()
    submitAnswerButton: PinchButton

    @input()
    restartAnswerButton: PinchButton

    @input()
    questionTextDisplay: Text

    @input()
    answerTextDisplay: Text

    @input()
    containerFrame: ContainerFrame

    private speechInputService: SpiritAnimalSpeechInput 

    private readonly questions: string[] = [
        // "What is your primary color?",
        // "What is your secondary color?"
        "When you're part of a team project, what role do you naturally take on?",
        "Others often say I am…",
        "When faced with a big decision, I usually…"
        // "Tell me about a time you felt truly proud of something you did. What made that moment meaningful to you?",
        // "What kind of situations or environments drain your energy the fastest and why?",
        // "How do you typically make a big decision? Walk me through your process.",
        // "If you had a full day to do anything you want, with no obligations, how would you spend it?",
        // "What kind of feedback or recognition feels most rewarding to you?",
        // "What is your profession, how would you describe your interest?",
        // "What are your hobbies and interests?"
    ];

    private currentQuestionIndex: number = 0;
    private savedAnswerText: string = "";
    private latestTranscription: string = "";
    private isListeningForAnswer: boolean = false;
    private isAnalyzingAnswers: boolean = false;

    protected getStateName(): string {
        return PersonalityQuizState.STATE_NAME
    }

    protected initializeUI(): void {
        if (ApplicationModel.instance && ApplicationModel.instance.speechInputService) {
            this.speechInputService = ApplicationModel.instance.speechInputService;
        } else {
            print("PersonalityQuizState: WARN - SpeechInputService not found in ApplicationModel!");
        }
        
        if (this.submitAnswerButton && this.submitAnswerButton.onButtonPinched) {
            this.submitAnswerButton.onButtonPinched.add(this.submitCurrentAnswer);
        } else {
            print("PersonalityQuizState: WARN - Submit Answer Button not assigned or has no onButtonPinched event.");
        }

        if (this.restartAnswerButton && this.restartAnswerButton.onButtonPinched) {
            this.restartAnswerButton.onButtonPinched.add(this.restartAnswer);
        } else {
            print("PersonalityQuizState: WARN - Restart Answer Button not assigned or has no onButtonPinched event.");
        }
        this.containerFrame.closeButton.onTrigger.add(() => {
            this.sendSignal("CANCEL_QUIZ");
        });
    }

    private displayCurrentQuestion(): void {
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            print(`Displaying Question ${this.currentQuestionIndex + 1}: ${question}`);
            if (this.questionTextDisplay) {
                this.questionTextDisplay.text = question;
            } else {
                print("PersonalityQuizState: WARN - questionTextDisplay not assigned.");
            }
            if (this.answerTextDisplay) {
                this.answerTextDisplay.text = "Listening...";
            }
            this.savedAnswerText = "";
            this.latestTranscription = "";

            // Automatically start voice recording for each question
            this.startSpeechRecognition();
        }
    }

    private startSpeechRecognition = () => {
        if (!this.speechInputService) {
            print("PersonalityQuizState: ERROR - SpeechInputService is not available for start.");
            if (this.answerTextDisplay) this.answerTextDisplay.text = "Speech service not ready.";
            return;
        }
        if (this.isListeningForAnswer) {
            print("PersonalityQuizState: Already listening.");
            return;
        }

        print("PersonalityQuizState: Starting speech recognition.");
        if (this.answerTextDisplay && this.savedAnswerText === "") {
            this.answerTextDisplay.text = "Listening...";
        }

        // Remove resetting currentAnswerText to allow appending
        this.speechInputService.onTranscriptionReady = this.handleTranscription;
        this.speechInputService.startListening();
        this.isListeningForAnswer = true;
    }

    private stopSpeechRecognition = () => {
        if (!this.speechInputService) {
            print("PersonalityQuizState: ERROR - SpeechInputService is not available for stop.");
            return;
        }
        if (this.isListeningForAnswer) {
            print("PersonalityQuizState: Manually stopping speech recognition.");
            this.speechInputService.stopListening();
            this.isListeningForAnswer = false;
        } else {
            print("PersonalityQuizState: Not currently listening, stop command ignored.");
        }
    }

    private restartAnswer = () => {
        print("PersonalityQuizState: Restarting answer recording.");

        // Stop any ongoing recognition first
        this.stopSpeechRecognition();

        // Reset current answer text
        this.savedAnswerText = "";
        this.latestTranscription = "";

        // Update display
        if (this.answerTextDisplay) {
            this.answerTextDisplay.text = "Listening...";
        }

        // Restart voice recognition after a short delay to ensure clean start
        new DoDelay(this.startSpeechRecognition).byFrame(1);
    }

    private handleTranscription = (transcription: string, isFinal: boolean) => {
        print(`PersonalityQuizState: Transcription received: "${transcription}", isFinal: ${isFinal}`);
        this.latestTranscription = transcription;

        if (isFinal) {
            this.savedAnswerText += (this.savedAnswerText ? " " : "") + this.latestTranscription;
            this.latestTranscription = "";
        }

        if (this.answerTextDisplay) {
            let textToShow = this.savedAnswerText;
            if (this.latestTranscription) {
                textToShow += (textToShow ? " " : "") + this.latestTranscription;
            }
            this.answerTextDisplay.text = textToShow + " 🎤";
        }
    }
    
    private submitCurrentAnswer = async () => {
        // Stop listening first
        this.stopSpeechRecognition();

        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            
            let finalAnswer = this.savedAnswerText;
            if (this.latestTranscription) {
                finalAnswer += (finalAnswer ? " " : "") + this.latestTranscription;
            }
            finalAnswer = finalAnswer.trim();

            if (finalAnswer.trim() === "") {
                print("PersonalityQuizState: WARN - Answer is empty. Please record an answer before submitting.");
                if (this.answerTextDisplay) this.answerTextDisplay.text = "Please record an answer first!";
                return;
            }
            print(`Submitting answer for question "${question}": "${finalAnswer}".`);

            if (!ApplicationModel.instance) {
                print("PersonalityQuizState: ERROR - ApplicationModel instance not found. Cannot save answer.");
                return;
            }
            ApplicationModel.instance.saveQuizAnswer(question, finalAnswer);

            this.currentQuestionIndex++;
            this.savedAnswerText = "";
            this.latestTranscription = "";
            if (this.currentQuestionIndex < this.questions.length) {
                this.displayCurrentQuestion();
            } else {
                print("PersonalityQuizState: All questions answered. Starting personality analysis.");
                if (this.questionTextDisplay) this.questionTextDisplay.text = "Analyzing your answers...";
                if (this.answerTextDisplay) this.answerTextDisplay.text = "Please wait.";
                this.setButtonsInteractive(false);

                await this.analyzeAndSavePersonality();
                this.sendSignal("REVEAL_SPIRIT_ANIMAL");
            }
        }
    }

    private async analyzeAndSavePersonality(): Promise<void> {
        if (this.isAnalyzingAnswers) {
            print("PersonalityQuizState: Analysis already in progress.");
            return;
        }
        this.isAnalyzingAnswers = true;

        if (!ApplicationModel.instance || !ApplicationModel.instance.chatService || !ApplicationModel.instance.getSavedQuizAnswers) {
            print("PersonalityQuizState: ERROR - ApplicationModel or required services/methods not available for analysis.");
            if (this.questionTextDisplay) this.questionTextDisplay.text = "Error during analysis setup.";
            this.isAnalyzingAnswers = false;
            this.setButtonsInteractive(true);
            return;
        }
        const savedAnswers = ApplicationModel.instance.getSavedQuizAnswers();
        if (!savedAnswers) {
            print("PersonalityQuizState: ERROR - No saved answers found to analyze.");
            if (this.questionTextDisplay) this.questionTextDisplay.text = "Could not retrieve answers for analysis.";
            this.isAnalyzingAnswers = false;
            this.setButtonsInteractive(true);
            return;
        }
        let promptContent = "Based on the following user's answers to a personality quiz, please identify their primary and secondary personality colors from this list: \n";
        promptContent += "🟡 Gold (The Organizer - responsible, dependable, loves structure), \n";
        promptContent += "🔵 Blue (The Harmonizer - compassionate, empathetic, loves connection), \n";
        promptContent += "🟠 Orange (The Adventurer - energetic, spontaneous, loves excitement), or \n";
        promptContent += "🟢 Green (The Conceptualizer - curious, analytical, loves ideas).\n";
        promptContent += "Your response MUST be in the format 'Primary: [Color], Secondary: [Color]'. Example: 'Primary: Gold, Secondary: Blue'. Do not include any other text, explanations, or punctuation.\n";
        promptContent += "\nQuiz Answers:\n";

        for (const question in savedAnswers) {
            if (question !== "primaryPersonalityColor" && question !== "secondaryPersonalityColor" && question !== "UserGoal") {
                promptContent += "Q: " + question + "\nA: " + savedAnswers[question] + "\n";
            }
        }

        print("PersonalityQuizState: Sending prompt to OpenAI: " + promptContent);

        try {
            const aiResponse = await ApplicationModel.instance.chatService.ask(promptContent);
            if (aiResponse) {
                print("PersonalityQuizState: Raw AI Response: " + aiResponse);
                
                const regex = /Primary: (Gold|Blue|Orange|Green), Secondary: (Gold|Blue|Orange|Green)/;
                const match = aiResponse.match(regex);

                if (match && match.length === 3) {
                    const primaryColor = match[1];
                    const secondaryColor = match[2];
                    ApplicationModel.instance.savePersonalityColors(primaryColor, secondaryColor);
                    print(`PersonalityQuizState: Successfully assigned and saved colors: Primary=${primaryColor}, Secondary=${secondaryColor}`);
                    if (this.questionTextDisplay) this.questionTextDisplay.text = "Analysis Complete!";
                    if (this.answerTextDisplay) this.answerTextDisplay.text = `Your colors: ${primaryColor} & ${secondaryColor}`;
                } else {
                    print("PersonalityQuizState: ERROR - AI response did not match expected format. Response: " + aiResponse);
                    if (this.questionTextDisplay) this.questionTextDisplay.text = "Could not determine personality from response.";
                    ApplicationModel.instance.savePersonalityColors("Blue", "Green");
                    if (this.answerTextDisplay) this.answerTextDisplay.text = "Could not determine colors. Defaulting...";
                }
            } else {
                print("PersonalityQuizState: ERROR - Received null or empty response from AI service.");
                if (this.questionTextDisplay) this.questionTextDisplay.text = "Error receiving AI analysis.";
                ApplicationModel.instance.savePersonalityColors("Blue", "Green");
                if (this.answerTextDisplay) this.answerTextDisplay.text = "Error: AI response empty. Defaulting...";
            }
        } catch (error: any) {
            print("PersonalityQuizState: ERROR - Exception during AI personality analysis: " + error.message);
            if (this.questionTextDisplay) this.questionTextDisplay.text = "Exception during AI analysis.";
            ApplicationModel.instance.savePersonalityColors("Blue", "Green");
            if (this.answerTextDisplay) this.answerTextDisplay.text = "Error: Analysis exception. Defaulting...";
        } finally {
            this.isAnalyzingAnswers = false;
        }
    }

    private setButtonsInteractive(interactive: boolean): void {
        const buttons = [this.submitAnswerButton, this.restartAnswerButton];
        for (const button of buttons) {
            if (button && button.getSceneObject()) {
                button.getSceneObject().enabled = interactive;
            }
        }
    }

    protected getTransitions(): any[] {
        return [
            {
                nextStateName: SpiritAnimalRevealState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "REVEAL_SPIRIT_ANIMAL";
                },
                onExecution: () => {
                    print("Transitioning from PersonalityQuiz to SpiritAnimalReveal");
                }
            },
            {
                nextStateName: MenuState.STATE_NAME,
                checkOnSignal: (signal: string) => {
                    return signal === "CANCEL_QUIZ";
                },
                onExecution: () => {
                    print("Transitioning from PersonalityQuiz to SpiritAnimalReveal");
                }
            }
        ];
    }

    protected onEnterState(): void {
        super.onEnterState();
        print("PersonalityQuizState: Entering state.");
        this.currentQuestionIndex = 0;
        this.savedAnswerText = "";
        this.latestTranscription = "";
        this.isListeningForAnswer = false;
        this.isAnalyzingAnswers = false;
        
        this.initializeUI();

        this.displayCurrentQuestion();
        this.setButtonsInteractive(true);
    }

    protected onExitState(): void {
        super.onExitState();
        print("PersonalityQuizState: Exiting state.");
        if (this.speechInputService) {
            if (this.isListeningForAnswer) {
                this.speechInputService.stopListening();
            }
            this.speechInputService.onTranscriptionReady = null;
            this.isListeningForAnswer = false;
        }
        this.setButtonsInteractive(true);
    }
}
