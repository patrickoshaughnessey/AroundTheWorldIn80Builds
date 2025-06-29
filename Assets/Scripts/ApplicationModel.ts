import StateMachine from "SpectaclesInteractionKit.lspkg/Utils/StateMachine"
import {FirstUserExperienceState} from "./ApplicationStates/FirstUserExperienceState";
import {MenuState} from "./ApplicationStates/MenuState";
import { OpenAIChatService } from "./OpenAIChatService"
import { SpiritAnimalSpeechInput } from "./SpiritAnimalSpeechInput"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo";
import {SpiritAnimalController} from "./SpiritAnimalController";
import { RealtimeDataService, UserSpiritAnimalData } from "./RealtimeDataService";
import {SessionController} from "SpectaclesSyncKit.lspkg/Core/SessionController";
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

    @input
    public realtimeDataService: RealtimeDataService;

    myAnimal: NetworkRootInfo = null;
    myData: UserSpiritAnimalData;

    get myAnimalController(): SpiritAnimalController {
        return this.myAnimal?.instantiatedObject?.getComponent(SpiritAnimalController.getTypeName()) as SpiritAnimalController;
    }

    get myAnimalGeometryParent(): SceneObject {
        return ApplicationModel.instance.myAnimalController?.spiritAnimalGeometryParent;
    }

    lastClickedAnimal: NetworkRootInfo = null;
    currentInteractionData: InteractionData;
    compatibilityAnalysisResult: string | null = null;

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
        print(`After save: ${this.getSavedQuizAnswers()}`);

        // Also save to realtime store
        if (this.realtimeDataService) {
            // We need to get all answers to update the whole object in the realtime store
            const allCurrentAnswers = this.getSavedQuizAnswers();
            this.realtimeDataService.updateLocalUserData({ quizAnswers: allCurrentAnswers });
        }
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

    public savePersonalityColors(primaryColor: string, secondaryColor: string) {
        let data = this.getSavedQuizAnswers() || {};
        data["primaryPersonalityColor"] = primaryColor;
        data["secondaryPersonalityColor"] = secondaryColor;
        this.persistentStorage.store.putString("quizAnswersObject", JSON.stringify(data));
        print(`Saved Personality Colors: Primary=${primaryColor}, Secondary=${secondaryColor}`);
        print(`After save: ${this.getPrimaryPersonalityColor()}, ${this.getSecondaryPersonalityColor()}`);

        // Also save to realtime store
        if (this.realtimeDataService) {
            this.realtimeDataService.updateLocalUserData({
                primaryPersonalityColor: primaryColor,
                secondaryPersonalityColor: secondaryColor
            });
        }
    }

    public getPrimaryPersonalityColor(): string | null {
        const data = this.getSavedQuizAnswers();
        if (data && data["primaryPersonalityColor"]) {
            return data["primaryPersonalityColor"];
        }
        return null;
    }

    public getSecondaryPersonalityColor(): string | null {
        const data = this.getSavedQuizAnswers();
        if (data && data["secondaryPersonalityColor"]) {
            return data["secondaryPersonalityColor"];
        }
        return null;
    }

    public saveUserGoal(goal: string) {
        let data = this.getSavedQuizAnswers() || {};
        data["UserGoal"] = goal;
        this.persistentStorage.store.putString("quizAnswersObject", JSON.stringify(data));
        print(`Saved User Goal: ${goal}`);
        print(`After save: ${this.getUserGoal()}`);

        // Also save to realtime store
        if (this.realtimeDataService) {
            this.realtimeDataService.updateLocalUserData({ userGoal: goal });
        }
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
        print("Quiz answers, personality colors, and user goal cleared");
    }

    public clearAllSavedData() {
        this.persistentStorage.store.remove("hasCompletedFirstLaunch");
        this.clearQuizAnswers();
        print("All saved data cleared");
    }

    public shareAllMyData() {
        if (this.realtimeDataService) {
            const localUserId = SessionController.getInstance()?.getLocalUserInfo()?.connectionId;
            print("ApplicationModel: Sharing the data we have on user: " + localUserId);

            const allCurrentAnswers = this.getSavedQuizAnswers();
            if (allCurrentAnswers) {
                this.realtimeDataService.updateLocalUserData({ quizAnswers: allCurrentAnswers });
            }

            const goal = this.getUserGoal()
            if (goal) {
                this.realtimeDataService.updateLocalUserData({ userGoal: goal });
            }

            const primaryColor = this.getPrimaryPersonalityColor()
            const secondaryColor = this.getSecondaryPersonalityColor()

            if (primaryColor && secondaryColor) {
                this.realtimeDataService.updateLocalUserData({
                    primaryPersonalityColor: primaryColor,
                    secondaryPersonalityColor: secondaryColor
                });
            }
        } else {
            print("ApplicationModel: NO REALTIME DATA SERVICE")
        }
    }
}
