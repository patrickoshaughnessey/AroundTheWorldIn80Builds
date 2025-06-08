import { BaseState } from "./BaseState"
import { ApplicationModel } from "../ApplicationModel"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"
import { SpiritAnimalRevealState } from "./SpiritAnimalRevealState"
import { SpiritAnimalSpeechInput } from "../SpiritAnimalSpeechInput"

@component
export class PersonalityQuizState extends BaseState {

    public static readonly STATE_NAME = "PersonalityQuiz"

    @input()
    submitAnswerButton: PinchButton

    @input()
    startRecordButton: PinchButton

    @input()
    stopRecordButton: PinchButton

    @input()
    questionTextDisplay: Text

    @input()
    answerTextDisplay: Text
    
    private speechInputService: SpiritAnimalSpeechInput 

    private readonly questions: string[] = [
        "When you're part of a team project, what role do you naturally take on and how do you make sure things go well?",
        "Tell me about a time you felt truly proud of something you did. What made that moment meaningful to you?",
        "What kind of situations or environments drain your energy the fastest and why?",
        "How do you typically make a big decision? Walk me through your process.",
        "If you had a full day to do anything you want, with no obligations, how would you spend it?",
        "What kind of feedback or recognition feels most rewarding to you?",
        "What is your profession, how would you describe your interest?",
        "What are your hobbies and interests?"
    ];

    private currentQuestionIndex: number = 0;
    private currentAnswerText: string = "";
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

        if (this.startRecordButton && this.startRecordButton.onButtonPinched) {
            this.startRecordButton.onButtonPinched.add(this.startSpeechRecognition);
        } else {
            print("PersonalityQuizState: WARN - Start Record Button not assigned or has no onButtonPinched event.");
        }

        if (this.stopRecordButton && this.stopRecordButton.onButtonPinched) {
            this.stopRecordButton.onButtonPinched.add(this.stopSpeechRecognition);
        } else {
            print("PersonalityQuizState: WARN - Stop Record Button not assigned or has no onButtonPinched event.");
        }
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
                this.answerTextDisplay.text = "Tap Start Record to answer...";
            }
            this.currentAnswerText = "";
        }
    }

    private startSpeechRecognition = () => {
        if (!this.speechInputService) {
            print("PersonalityQuizState: ERROR - SpeechInputService is not available for start.");
            if (this.answerTextDisplay) this.answerTextDisplay.text = "Speech service not ready.";
            return;
        }
        if (this.isListeningForAnswer) {
            print("PersonalityQuizState: Already listening. Press Stop Record first if you want to restart.");
            return;
        }

        print("PersonalityQuizState: Starting speech recognition.");
        if (this.answerTextDisplay) this.answerTextDisplay.text = "Listening...";
        
        this.currentAnswerText = "";
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
            if (this.answerTextDisplay && this.currentAnswerText === "") {
                this.answerTextDisplay.text = "Stopped. Tap Start Record to try again.";
            }
        } else {
            print("PersonalityQuizState: Not currently listening, stop command ignored.");
        }
    }

    private handleTranscription = (transcription: string) => {
        print(`PersonalityQuizState: Transcription received: "${transcription}"`);
        this.currentAnswerText = transcription;
        if (this.answerTextDisplay) {
            this.answerTextDisplay.text = transcription;
        } else {
            print("PersonalityQuizState: WARN - answerTextDisplay not assigned.");
        }
        this.isListeningForAnswer = false;
        print("PersonalityQuizState: Transcription handled. isListeningForAnswer is now false.");
    }
    
    private submitCurrentAnswer = async () => {
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            if (this.currentAnswerText.trim() === "") {
                print("PersonalityQuizState: WARN - Answer is empty. Please record an answer before submitting.");
                if (this.answerTextDisplay) this.answerTextDisplay.text = "Please record an answer first!";
                return;
            }
            print(`Submitting answer for question "${question}": "${this.currentAnswerText}".`);

            if (!ApplicationModel.instance) {
                print("PersonalityQuizState: ERROR - ApplicationModel instance not found. Cannot save answer.");
                return;
            }
            ApplicationModel.instance.saveQuizAnswer(question, this.currentAnswerText);

            this.currentQuestionIndex++;
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
        const buttons = [this.submitAnswerButton, this.startRecordButton, this.stopRecordButton];
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
            }
        ];
    }

    protected onEnterState(): void {
        super.onEnterState();
        print("PersonalityQuizState: Entering state.");
        this.currentQuestionIndex = 0;
        this.currentAnswerText = "";
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
