import {StateConfig} from "SpectaclesInteractionKit.lspkg/Utils/State"
import {SpiritAnimalController} from "../SpiritAnimalController"

export abstract class BaseSpiritAnimalState extends BaseScriptComponent {
    protected stateName: string

    protected stateDebugText: Text

    protected controller: SpiritAnimalController

    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
    }

    onStart() {
        // Add this state to the state machine
        this.registerState()

        // Initialize our UI
        this.initializeState()
    }

    protected abstract getStateName(): string
    protected abstract initializeState(): void

    private registerState() {
        this.stateName = this.getStateName()
        const transitions = this.getTransitions()
        const stateConfig: StateConfig = {
            name: this.stateName,
            onEnter: () => {
                print(`SpiritAnimalStateMachine calling onEnter for ${this.stateName}`)
                this.onEnterState()
            },
            onExit: () => {
                print(`SpiritAnimalStateMachine calling onExit for ${this.stateName}`)
                this.onExitState()
            },
            onUpdate: () => this.onUpdateState(),
            onSignal: () => this.onSignalReceived(),
            transitions: transitions,
        }

        print(`Registering spirit animal state: ${this.stateName}`)

        // Get the SpiritAnimalController instance and register the state
        this.controller = this.getSceneObject().getComponent(SpiritAnimalController.getTypeName()) as SpiritAnimalController
        if (this.controller && this.controller.spiritAnimalStateMachine) {
            this.controller.spiritAnimalStateMachine.addState(stateConfig)
            print(`Spirit animal state registered: ${this.stateName}`)
        } else {
            print(`Error: Could not find SpiritAnimalController or state machine is not initialized`)
        }
    }

    protected abstract getTransitions(): any[]
    
    // State lifecycle methods that can be overridden
    protected onEnterState() {
        print(`Entered ${this.stateName} state`)
        if (this.controller.stateDebugText) {
            this.controller.stateDebugText.text = this.stateName
        }
    }
    
    protected onExitState() {
        print(`Exited ${this.stateName} state`)
    }
    
    protected onUpdateState() {
        // Override in child classes if needed
    }
    
    protected onSignalReceived() {
        // Override in child classes if needed
    }

    // Utility method to send signals to state machine
    protected sendSignal(signal: string, data: any = null) {
        print("=== SENDING SIGNAL ===")
        print("Signal: " + signal)
        
        // Get the SpiritAnimalController instance and send the signal
        const controller = this.getSceneObject().getComponent(SpiritAnimalController.getTypeName()) as SpiritAnimalController
        if (controller && controller.spiritAnimalStateMachine) {
            print("Current state before signal: " + controller.spiritAnimalStateMachine.currentState?.name)
            controller.spiritAnimalStateMachine.sendSignal(signal, data)
            print("Current state after signal: " + controller.spiritAnimalStateMachine.currentState?.name)
        } else {
            print(`Error: Could not find SpiritAnimalController or state machine is not initialized`)
        }
        
        print("=== SIGNAL SENT ===")
    }

    // Convenience method to check if this is my spirit animal
    protected isMyAnimal(): boolean {
        return this.controller?.syncEntity?.networkRoot?.locallyCreated || false;
    }
}