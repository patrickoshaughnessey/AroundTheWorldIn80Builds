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
        this.hideUI()

        // Initialize UI references
        this.initializeUI()
        
        // Add this state to the state machine
        this.registerState()
    }
    
    protected abstract getStateName(): string
    protected abstract initializeUI(): void

    private registerState() {
        this.stateName = this.getStateName()
        
        const stateConfig: StateConfig = {
            name: this.stateName,
            onEnter: () => this.onEnterState(),
            onExit: () => this.onExitState(),
            onUpdate: () => this.onUpdateState(),
            onSignal: () => this.onSignalReceived(),
            transitions: this.getTransitions()
        }

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
        }
    }
    
    // Utility method to send signals to state machine
    protected sendSignal(signal: string, data: any = null) {
        ApplicationModel.instance.applicationStateMachine.sendSignal(signal, data)
    }

}