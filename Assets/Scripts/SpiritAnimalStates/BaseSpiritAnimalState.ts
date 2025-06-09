import {StateConfig} from "SpectaclesInteractionKit.lspkg/Utils/State"
import {SpiritAnimalController} from "../SpiritAnimalController"

declare var Time: {
    deltaTime: number
}

export abstract class BaseSpiritAnimalState extends BaseScriptComponent {
    
    public spiritAnimalController: SpiritAnimalController;

    public getConfig(): StateConfig {
        const stateName = this.getStateName();
        return {
            name: stateName,
            onEnter: () => this.onEnterState(),
            onExit: () => this.onExitState(),
            onUpdate: () => this.onUpdateState(),
            onSignal: () => this.onSignalReceived(),
            transitions: this.getTransitions(),
        };
    }

    public abstract getStateName(): string;
    
    protected getTransitions(): any[] {
        return []; // Default to no transitions
    }
    
    // State lifecycle methods that can be overridden by children
    protected onEnterState() {
        print(`Entered ${this.getStateName()} state`);
        if (this.spiritAnimalController && this.spiritAnimalController.stateDebugText) {
            this.spiritAnimalController.stateDebugText.text = this.getStateName();
        }
    }
    
    protected onExitState() {
        print(`Exited ${this.getStateName()} state`);
    }
    
    protected onUpdateState() {
        // Override in child classes if needed. Use Time.deltaTime for time-based logic.
    }
    
    protected onSignalReceived() {
        // Override in child classes if needed. Access signal data from a shared model if necessary.
    }

    // Utility method to send signals to the state machine
    protected sendSignal(signal: string, data: any = null) {
        if (this.spiritAnimalController && this.spiritAnimalController.spiritAnimalStateMachine) {
            this.spiritAnimalController.spiritAnimalStateMachine.sendSignal(signal, data);
        } else {
            print(`Error: Could not find SpiritAnimalController or state machine is not initialized in ${this.getStateName()}`);
        }
    }

    // Convenience method to check if this is my spirit animal
    protected isMyAnimal(): boolean {
        return this.spiritAnimalController?.syncEntity?.networkRoot?.locallyCreated || false;
    }
}