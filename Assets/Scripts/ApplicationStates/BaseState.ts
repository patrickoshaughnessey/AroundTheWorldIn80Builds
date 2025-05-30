import {StateConfig} from "SpectaclesInteractionKit.lspkg/Utils/State"
import {ApplicationModel} from "../ApplicationModel"
declare global {
    var WorldPlacement: any;
}

export abstract class BaseState extends BaseScriptComponent {
    protected stateName: string
    
    @input()
    protected rootObject: SceneObject

    onAwake() {
        this.createEvent("OnStartEvent").bind(() => this.onStart())
    }

    onStart() {
        // Add this state to the state machine
        this.registerState()

        // Initialize our UI
        this.initializeUI()

        // Hide the UI until the state starts
        this.hideUI()
    }

    protected abstract getStateName(): string
    protected abstract initializeUI(): void

    private registerState() {
        this.stateName = this.getStateName()
        const transitions = this.getTransitions()
        const stateConfig: StateConfig = {
            name: this.stateName,
            onEnter: () => {
                print(`StateMachine calling onEnter for ${this.stateName}`)
                this.onEnterState()
            },
            onExit: () => {
                print(`StateMachine calling onExit for ${this.stateName}`)
                this.onExitState()
            },
            onUpdate: () => this.onUpdateState(),
            onSignal: () => this.onSignalReceived(),
            transitions: transitions,
        }

        print(`Registering state: ${this.stateName}`)
        print("stateConfig: " + JSON.stringify(stateConfig, null, 2))
        print(`getTransitions() returned: ${JSON.stringify(transitions)}`)
        print(`Transitions array length: ${transitions.length}`)

        ApplicationModel.instance.applicationStateMachine.addState(stateConfig)
    }

    protected abstract getTransitions(): any[]
    
    // State lifecycle methods that can be overridden
    protected onEnterState() {
        print(`Entered ${this.stateName} state`)
        this.showUI()

        if (this.rootObject) {
            var worldPlacement = new WorldPlacement(this.rootObject);
            worldPlacement.start(true);
        }
    }
    
    protected onExitState() {
        print(`Exited ${this.stateName} state`)
        this.hideUI()
    }
    
    protected onUpdateState() {
        // Override in child classes if needed
    }
    
    protected onSignalReceived() {
        // Override in child classes if needed
    }
    
    // UI Management
    protected showUI() {
        if (this.rootObject) {
            this.rootObject.enabled = true
        }
    }
    
    protected hideUI() {
        if (this.rootObject) {
            this.rootObject.enabled = false
        } else {
            print("No root object defined!")
        }
    }
    
    // Utility method to send signals to state machine
    // Add this to your sendSignal method to see what's happening
    protected sendSignal(signal: string, data: any = null) {
        print("=== SENDING SIGNAL ===")
        print("Signal: " + signal)
        print("Current state before signal: " + ApplicationModel.instance.applicationStateMachine.currentState?.name)
        ApplicationModel.instance.applicationStateMachine.sendSignal(signal, data)
        print("Current state after signal: " + ApplicationModel.instance.applicationStateMachine.currentState?.name)
        print("=== SIGNAL SENT ===")
    }

}