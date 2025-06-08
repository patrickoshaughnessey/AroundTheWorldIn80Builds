import { SessionController } from "SpectaclesSyncKit.lspkg/Core/SessionController"
import {ApplicationModel} from "./ApplicationModel";

// Interface defining the structure of the data we'll store for each user
export interface UserSpiritAnimalData {
    userId: string;
    primaryPersonalityColor?: string;
    secondaryPersonalityColor?: string;
    quizAnswers?: { [key: string]: string };
    userGoal?: string;
}

@component
export class RealtimeDataService extends BaseScriptComponent {
    private static _instance: RealtimeDataService;

    private readonly STORE_ID: string = "SpiritAnimalDataStore";
    private realtimeStore: GeneralDataStore | null = null;
    private isStoreInitialized: boolean = false;
    private localUserId: string = "";

    // A map to hold all users' data locally for easy access
    private allUsersData: Map<string, UserSpiritAnimalData> = new Map<string, UserSpiritAnimalData>();
    
    // Callbacks for subscribers
    public onDataUpdated: ((allData: Map<string, UserSpiritAnimalData>) => void) | null = null;
    public onStoreReady: (() => void) | null = null;

    // Singleton getter
    static get instance(): RealtimeDataService {
        if (!RealtimeDataService._instance) {
            print("Warning: No RealtimeDataService instance found!");
        }
        return RealtimeDataService._instance;
    }

    onAwake(): void {
        if (RealtimeDataService._instance && RealtimeDataService._instance !== this) {
            print("Warning: Multiple RealtimeDataService instances detected. Destroying duplicate.");
            this.getSceneObject().destroy();
            return;
        }
        RealtimeDataService._instance = this;
        print("RealtimeDataService singleton initialized");

        this.initialize();
    }
    
    private initialize(): void {
        const sessionController = SessionController.getInstance();
        if (!sessionController || !sessionController.getSession()) {
            print("RealtimeDataService: Session not created yet. Waiting for creation.");
            sessionController.notifyOnStartColocated(this.startService);
            return;
        }
        this.startService();
    }

    private startService = (): void => {
        print("RealtimeDataService: Session connected. Starting service.");
        this.createOrFindRealtimeStore(() => {
            this.isStoreInitialized = true;
            this.localUserId = SessionController.getInstance()?.getLocalUserInfo()?.connectionId;
            print(`RealtimeDataService: Store '${this.STORE_ID}' is ready. Local User ID: ${this.localUserId}`);

            ApplicationModel.instance.shareAllMyData()

            this.loadInitialData();

            // Subscribe to future updates
            SessionController.getInstance().onRealtimeStoreUpdated.add(this.onStoreUpdate);
            
            // Notify subscribers that the store is ready
            if (this.onStoreReady) {
                this.onStoreReady();
            }
        });
    }

    private createOrFindRealtimeStore(onReady: () => void): void {
        const session = SessionController.getInstance().getSession();
        
        // Find existing store
        for (const store of session.allRealtimeStores) {
            if (session.getRealtimeStoreInfo(store).storeId === this.STORE_ID) {
                this.realtimeStore = store;
                print("RealtimeDataService: Found existing store.");
                onReady();
                return;
            }
        }

        // Create new store if not found
        print("RealtimeDataService: No existing store found. Creating new one.");
        const storeOpts = RealtimeStoreCreateOptions.create();
        storeOpts.persistence = RealtimeStoreCreateOptions.Persistence.Persist;
        storeOpts.ownership = RealtimeStoreCreateOptions.Ownership.Unowned;
        storeOpts.allowOwnershipTakeOver = false;
        storeOpts.storeId = this.STORE_ID;

        session.createRealtimeStore(storeOpts, 
            (store) => {
                this.realtimeStore = store;
                onReady();
            },
            () => {
                print("RealtimeDataService: FATAL - Failed to create realtime store.");
            }
        );
    }

    private loadInitialData(): void {
        if (!this.realtimeStore) return;

        SessionController.getInstance().getSession().activeUsersInfo.forEach((userInfo) => {
            const userKey = userInfo.connectionId;
            if (this.realtimeStore.has(userKey)) {
                try {
                    const dataString = this.realtimeStore.getString(userKey);
                    const data: UserSpiritAnimalData = JSON.parse(dataString);
                    this.allUsersData.set(userKey, data);
                    print(`RealtimeDataService: Loaded initial data for user ${userKey}`);
                } catch(e: any) {
                    print(`RealtimeDataService: ERROR parsing data for user ${userKey}: ${e.message}`);
                }
            }
        });

        // Notify subscribers of the initial data load
        if (this.onDataUpdated) {
            this.onDataUpdated(this.allUsersData);
        }
    }

    private onStoreUpdate = (session: MultiplayerSession, store: GeneralDataStore, key: string, updateInfo: ConnectedLensModule.RealtimeStoreUpdateInfo): void => {
        print(`RealtimeDataService: onStoreUpdate.`);
        if (!this.realtimeStore || session.getRealtimeStoreInfo(store).storeId !== this.STORE_ID) return;

        // The key is the userId in our new model
        const userId = key;
        
        try {
            const dataString = this.realtimeStore.getString(userId);
            print(`RealtimeDataService: Received dataString ${dataString}.`);
            if (dataString && dataString.length > 0) {
                const data: UserSpiritAnimalData = JSON.parse(dataString);
                this.allUsersData.set(userId, data);
                print(`RealtimeDataService: Received update for user ${userId}. ${JSON.stringify(data)}`);
                print(`RealtimeDataService: All user data now: ${JSON.stringify(this.allUsersData)}`);
                // Notify subscribers
                if (this.onDataUpdated) {
                    this.onDataUpdated(this.allUsersData);
                }
            }
        } catch(e: any) {
            print(`RealtimeDataService: ERROR parsing updated data for user ${userId}: ${e.message}`);
        }
    }

    // Public method to save/update the local user's data
    public updateLocalUserData(data: Partial<UserSpiritAnimalData>): void {
        if (!this.isStoreInitialized || !this.realtimeStore) {
            print("RealtimeDataService: WARN - Store not ready, cannot update user data yet.");
            return;
        }

        print("RealtimeDataService: Updating user (" + this.localUserId + ") data with: " + JSON.stringify(data));
        // Get existing data or create new object
        const existingData = this.allUsersData.get(this.localUserId) || { userId: this.localUserId };
        // Merge new data into existing data
        const updatedData: UserSpiritAnimalData = { ...existingData, ...data };
        
        this.allUsersData.set(this.localUserId, updatedData);

        try {
            const dataString = JSON.stringify(updatedData);
            this.realtimeStore.putString(this.localUserId, dataString);
            print(`RealtimeDataService: Updated local user data for ${this.localUserId}`);
        } catch(e: any) {
            print(`RealtimeDataService: ERROR stringifying data for local user: ${e.message}`);
        }
    }

    public getLocalUserId(): string {
        return this.localUserId;
    }

    public getAllUsersData(): Map<string, UserSpiritAnimalData> {
        return this.allUsersData;
    }

    public getDataForUser(userId: string): UserSpiritAnimalData | null {
        let data = this.allUsersData.get(userId);
        if (data) {
            print(`RealtimeDataService: found data for user ${userId}`);
            return data;
        }
        if (!data && this.realtimeStore) {
            data = JSON.parse(this.realtimeStore.getString(userId));
            print(`RealtimeDataService: data not in memory, got from store: ${JSON.stringify(data)}`);
            return data;
        }
        return null;
    }
} 