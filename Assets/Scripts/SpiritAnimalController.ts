import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {SyncEntity} from "SpectaclesSyncKit.lspkg/Core/SyncEntity"
import {NetworkRootInfo} from "SpectaclesSyncKit.lspkg/Core/NetworkRootInfo"
import {Headlock} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Headlock/Headlock"
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { OpenAIChatService } from "./OpenAIChatService";
import { SpiritAnimalSpeechInput } from "./SpiritAnimalSpeechInput";

@component
export class SpiritAnimalController extends BaseScriptComponent {        
    manipulatable: InteractableManipulation = null; // Initialize to null

    headLock: Headlock = null; // Initialize to null

    // --- New AI Chat Inputs ---
    interactable: Interactable = null; // For detecting taps/interaction with the spirit animal, initialized to null

    chatService: OpenAIChatService = null; // Reference to our OpenAI chat service, initialized to null

    speechInputService: SpiritAnimalSpeechInput = null; // Reference to our speech input service, initialized to null

    chatDisplayLabel: Text = null; // Optional: For displaying the conversation, initialized to null
    // --- End New AI Chat Inputs ---

    networkRootInfo: NetworkRootInfo
    syncEntity: SyncEntity
    sceneObj: SceneObject

    private isChatting: boolean = false; // To prevent multiple interactions while processing

    onReady() {
        print("SpiritAnimalController: onReady triggered.");    

        // Attempt to self-assign Manipulatable component if not already set
        if (!this.manipulatable && this.sceneObj) {
            try {
                const foundManipulatable = this.sceneObj.getComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
                if (foundManipulatable) {
                    this.manipulatable = foundManipulatable;
                    print("SpiritAnimalController: Successfully self-assigned Manipulatable component in onReady.");
                } else {
                    print("SpiritAnimalController: WARN - Could not find/self-assign Manipulatable component in onReady. Manipulation might not work.");
                    // Decide if this is fatal. For now, proceeding without it.
                }
            } catch (e: any) {
                print("SpiritAnimalController: ERROR trying to self-assign Manipulatable in onReady: " + e.message);
            }
        }

        // Attempt to self-assign Headlock component if not already set
        if (!this.headLock && this.sceneObj) {
            try {
                const foundHeadlock = this.sceneObj.getComponent(Headlock.getTypeName()) as Headlock;
                if (foundHeadlock) {
                    this.headLock = foundHeadlock;
                    print("SpiritAnimalController: Successfully self-assigned Headlock component in onReady.");
                } else {
                    print("SpiritAnimalController: WARN - Could not find/self-assign Headlock component in onReady. Headlock might not work.");
                }
            } catch (e: any) {
                print("SpiritAnimalController: ERROR trying to self-assign Headlock in onReady: " + e.message);
            }
        }

        // Attempt to self-assign Interactable component (already had this logic)
        if (!this.interactable && this.sceneObj) { 
            try {
                const foundInteractable = this.sceneObj.getComponent(Interactable.getTypeName()) as Interactable;
                if (foundInteractable) {
                    this.interactable = foundInteractable;
                    print("SpiritAnimalController: Successfully self-assigned Interactable component in onReady.");
                } else {
                    print("SpiritAnimalController: WARN - Could not find/self-assign Interactable component in onReady. Chat trigger will not work.");
                }
            } catch (e: any) {
                 print("SpiritAnimalController: ERROR trying to self-assign Interactable: " + e.message);
            }
        }

        if (this.networkRootInfo && this.networkRootInfo.locallyCreated) {
            print("Animal belongs to me, I can move it and chat with it.");
            if (this.manipulatable) this.manipulatable.setCanTranslate(true);
            else print("SpiritAnimalController: Manipulatable component missing, cannot enable translation.");
            
            if (this.interactable && this.chatService && this.speechInputService) {
                this.interactable.onInteractorTriggerEnd.add(this.handleInteraction);
                print("Chat interaction initialized for spirit animal.");
            } else {
                print("SpiritAnimalController: WARN - Missing one or more AI chat dependencies for onReady setup.");
                if (!this.interactable) print("SpiritAnimalController: Interactable is missing in onReady.");
                if (!this.chatService) print("SpiritAnimalController: ChatService is missing in onReady.");
                if (!this.speechInputService) print("SpiritAnimalController: SpeechInputService is missing in onReady.");
            }
        } else {
            print("Animal doesn't belong to me, I can't move or chat with it.");
            if (this.manipulatable) this.manipulatable.setCanTranslate(false);
            if (this.headLock) this.headLock.enabled = false;
            else print("SpiritAnimalController: Headlock component missing, cannot disable it for non-local animal.");
        }

        // Assign transcription callback here, now that speechInputService should be populated by Instantiator
        if (this.speechInputService) {
            this.speechInputService.onTranscriptionReady = this.handleTranscriptionReady;
            print("SpiritAnimalController: onTranscriptionReady callback assigned in onReady.");
        } else {
            print("SpiritAnimalController: WARN - SpeechInputService still not assigned in onReady. Transcription callback cannot be set.");
        }
    }

    onAwake() {
       this.sceneObj = this.getSceneObject(); 

       // Initial attempt to get Manipulatable in onAwake
       if (!this.manipulatable && this.sceneObj) { 
           try {
                const foundManipulatable = this.sceneObj.getComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
                if (foundManipulatable) {
                    this.manipulatable = foundManipulatable;
                    print("SpiritAnimalController: Successfully self-assigned Manipulatable component in onAwake.");
                }
           } catch (e:any) {
               print("SpiritAnimalController: ERROR trying to self-assign Manipulatable in onAwake: " + e.message);
           }
       }

       // Initial attempt to get Headlock in onAwake
       if (!this.headLock && this.sceneObj) { 
           try {
                const foundHeadlock = this.sceneObj.getComponent(Headlock.getTypeName()) as Headlock;
                if (foundHeadlock) {
                    this.headLock = foundHeadlock;
                    print("SpiritAnimalController: Successfully self-assigned Headlock component in onAwake.");
                }
           } catch (e:any) {
               print("SpiritAnimalController: ERROR trying to self-assign Headlock in onAwake: " + e.message);
           }
       }

       this.syncEntity = new SyncEntity(this)
       print("SpiritAnimalController: syncEntity object: " + this.syncEntity + " for scene object: " + this.sceneObj.name);
       this.syncEntity.notifyOnReady(() => {
           print("SyncEntity is ready with networkRoot: " + this.syncEntity.networkRoot)
           this.onReady(); // Call onReady after syncEntity has processed network info
       })

       // Initial attempt to get interactable in onAwake as well, in case onReady is delayed or order varies.
       if (!this.interactable && this.sceneObj) { 
           try {
                const foundInteractable = this.sceneObj.getComponent(Interactable.getTypeName()) as Interactable;
                if (foundInteractable) {
                    this.interactable = foundInteractable;
                    print("SpiritAnimalController: Successfully self-assigned Interactable component in onAwake.");
                }
           } catch (e:any) {
               print("SpiritAnimalController: ERROR trying to self-assign Interactable in onAwake: " + e.message);
           }
       }
    }

    private handleInteraction = (event: InteractorEvent) => {
        if (this.isChatting) {
            print("SpiritAnimalController: Already processing a chat interaction.");
            return;
        }
        if (!this.networkRootInfo || !this.networkRootInfo.locallyCreated) {
            print("SpiritAnimalController: Interaction ignored, animal not locally owned.");
            return;
        }
        if (!this.interactable) {
             print("SpiritAnimalController: Interactable component not available for handleInteraction.");
            return;
        }
        if (!this.chatService || !this.speechInputService) {
            print("SpiritAnimalController: Chat or Speech service not available for handleInteraction.");
            return;
        }

        print("SpiritAnimalController: Interaction detected. Starting chat flow.");
        this.isChatting = true;
        if (this.chatDisplayLabel) {
            this.chatDisplayLabel.text = "Listening...";
        }
        print("SpiritAnimalController: Calling speechInputService.startListening()");
        this.speechInputService.startListening();
    };

    private handleTranscriptionReady = async (transcription: string) => {
        if (!transcription) {
            print("SpiritAnimalController: Received empty transcription.");
            if (this.chatDisplayLabel) {
                this.chatDisplayLabel.text = "Sorry, I didn't catch that.";
            }
            this.isChatting = false;
            return;
        }

        print("SpiritAnimalController: Transcription ready: " + transcription);
        if (this.chatDisplayLabel) {
            this.chatDisplayLabel.text = "You: " + transcription;
        }

        if (this.chatService) {
            if (this.chatDisplayLabel) { 
                 this.chatDisplayLabel.text += "\nThinking...";
            }
            const aiResponse = await this.chatService.ask(transcription);
            if (aiResponse) {
                print("SpiritAnimalController: AI Response: " + aiResponse);
                if (this.chatDisplayLabel) {
                    this.chatDisplayLabel.text = "You: " + transcription + "\nSpirit Animal: " + aiResponse;
                }
            } else {
                print("SpiritAnimalController: No response from AI.");
                if (this.chatDisplayLabel) {
                    this.chatDisplayLabel.text = "You: " + transcription + "\nSpirit Animal: I'm not sure how to respond right now.";
                }
            }
        } else {
            print("SpiritAnimalController: ChatService is not available to process transcription.");
        }
        this.isChatting = false;
    };

    onDestroy() {
        // Clean up listeners
        if (this.interactable && this.networkRootInfo && this.networkRootInfo.locallyCreated) {
            this.interactable.onInteractorTriggerEnd.remove(this.handleInteraction);
        }
        // Detach callback if speechInputService exists, to prevent issues if this controller is destroyed before the service
        if (this.speechInputService) {
            this.speechInputService.onTranscriptionReady = null; 
        }
    }
}
