import StateMachine from "SpectaclesInteractionKit.lspkg/Utils/StateMachine"
import {FirstUserExperienceState} from "./ApplicationStates/FirstUserExperienceState";
import {MenuState} from "./ApplicationStates/MenuState";
import { OpenAIChatService } from "./OpenAIChatService"
import { SpiritAnimalSpeechInput } from "./SpiritAnimalSpeechInput"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo";
import {SpiritAnimalController} from "./SpiritAnimalController";
declare global {
    var DoDelay: any;
}

export interface InteractionData {
    initiatorID: string;
    receiverID: string;
    initiatorAnimalNetworkId: string;
    receiverAnimalNetworkId: string;
    meetingLocation: vec3
}

@component
export class ApplicationModel extends BaseScriptComponent {
    private static _instance: ApplicationModel;

    // Add the application state machine
    public applicationStateMachine: StateMachine;

    // Persistent storage reference
    public persistentStorage: PersistentStorageSystem;

    // AI Services
    @input
    public chatService: OpenAIChatService;

    @input
    public speechInputService: SpiritAnimalSpeechInput;

    myAnimal: NetworkRootInfo = null;

    get myAnimalController(): SpiritAnimalController {
        return this.myAnimal?.instantiatedObject?.getComponent(SpiritAnimalController.getTypeName()) as SpiritAnimalController;
    }

    get myAnimalGeometryParent(): SceneObject {
        return ApplicationModel.instance.myAnimalController?.spiritAnimalGeometryParent;
    }

    lastClickedAnimal: NetworkRootInfo = null;
    currentInteractionData: InteractionData;

    // Singleton getter
    static get instance(): ApplicationModel {
        if (!ApplicationModel._instance) {
            print("Warning: No ApplicationModel instance found!");
        }
        return ApplicationModel._instance;
    }

    onAwake(): void {
        // Ensure singleton pattern
        if (ApplicationModel._instance && ApplicationModel._instance !== this) {
            print("Warning: Multiple ApplicationModel instances detected. Destroying duplicate.");
            this.getSceneObject().destroy();
            return;
        }

        ApplicationModel._instance = this;

        // Initialize the state machine and persistent storage
        this.initializeCore();

        print("ApplicationModel singleton initialized");

        new DoDelay(() => this.start()).byFrame(); // one-frame delay to give all scripts initialization time
    }

    start() {

        print("Starting first state...");
        if (this.isFirstLaunch()) {
            this.applicationStateMachine.enterState(FirstUserExperienceState.STATE_NAME)
        } else {
            this.applicationStateMachine.enterState(MenuState.STATE_NAME)
        }
    }

    onDestroy(): void {
        // Clean up singleton reference if this instance is being destroyed
        if (ApplicationModel._instance === this) {
            ApplicationModel._instance = null;
        }

        // Clean up state machine
        if (this.applicationStateMachine) {
            this.applicationStateMachine.destroy();
        }
    }

    private initializeCore() {
        // Initialize the state machine
        this.applicationStateMachine = new StateMachine("ApplicationFlow")

        // Get persistent storage
        this.persistentStorage = global.persistentStorageSystem
    }

    // Utility methods for persistent storage
    public isFirstLaunch(): boolean {
        if (this.persistentStorage.store.has("hasCompletedFirstLaunch")) {
            return !this.persistentStorage.store.getBool("hasCompletedFirstLaunch")
        }
        return true
    }

    public setFirstLaunchComplete() {
        this.persistentStorage.store.putBool("hasCompletedFirstLaunch", true)
        print("First launch marked as complete")
    }

    public setFirstLaunchTODO() {
        this.persistentStorage.store.putBool("hasCompletedFirstLaunch", false)
        print("Resetting first user launch flag")
    }

    public saveQuizAnswer(question: string, answer: string) {
        let answers = this.getSavedQuizAnswers() || {};
        answers[question] = answer;
        this.persistentStorage.store.putString("quizAnswersObject", JSON.stringify(answers));
        print(`Saved answer for: ${question}`);
    }

    public getSavedQuizAnswers(): {[key: string]: string} | null {
        if (this.persistentStorage.store.has("quizAnswersObject")) {
            const answersJson = this.persistentStorage.store.getString("quizAnswersObject");
            try {
                return JSON.parse(answersJson);
            } catch (e) {
                print("Error parsing quiz answers: " + e);
                return null;
            }
        }
        return null;
    }

    public savePersonalityColor(color: string) {
        let answers = this.getSavedQuizAnswers() || {};
        answers["PersonalityColor"] = color;
        this.persistentStorage.store.putString("quizAnswersObject", JSON.stringify(answers));
        print(`Saved Personality Color: ${color}`);
    }

    public getPersonalityColor(): string | null {
        const answers = this.getSavedQuizAnswers();
        if (answers && answers["PersonalityColor"]) {
            return answers["PersonalityColor"];
        }
        return null;
    }

    public saveUserGoal(goal: string) {
        let data = this.getSavedQuizAnswers() || {};
        data["UserGoal"] = goal;
        this.persistentStorage.store.putString("quizAnswersObject", JSON.stringify(data));
        print(`Saved User Goal: ${goal}`);
    }

    public getUserGoal(): string | null {
        const data = this.getSavedQuizAnswers();
        if (data && data["UserGoal"]) {
            return data["UserGoal"];
        }
        return null;
    }

    public clearQuizAnswers() {
        this.persistentStorage.store.remove("quizAnswersObject");
        print("Quiz answers, personality color, and user goal cleared");
    }

    public clearAllSavedData() {
        this.persistentStorage.store.remove("hasCompletedFirstLaunch");
        this.clearQuizAnswers();
        print("All saved data cleared");
    }
}
