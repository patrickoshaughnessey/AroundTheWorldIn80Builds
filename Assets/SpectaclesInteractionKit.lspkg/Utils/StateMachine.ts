/**
 * StateMachine
 */

import NativeLogger from "./NativeLogger"
import State, {StateConfig, Transition} from "./State"

import {LensConfig} from "./LensConfig"
import {DispatchedUpdateEvent} from "./UpdateDispatcher"
import {EventDispatcher} from "./EventDispatcher"

const TAG = "StateMachine"

export default class StateMachine {
  private name: string
  private _currentState: State | null = null
  private _previousState: State | null = null
  private states: any = {}
  private stateCount = 0
  private verboseLogs = false

  public onStateChanged: EventDispatcher<State> = new EventDispatcher<State>()

  private log: NativeLogger
  private lateUpdateEvent: DispatchedUpdateEvent
  private updateEvent: DispatchedUpdateEvent

  constructor(name: string) {
    this.name = name ?? "StateMachine"
    this.log = new NativeLogger(TAG + "#" + this.name)

    let lensConfig = LensConfig.getInstance()
    let updateDispatcher = lensConfig.updateDispatcher
    this.updateEvent = updateDispatcher.createUpdateEvent("StateMachineUpdate")
    this.updateEvent.bind(() => {
      this.update()
    })
    this.lateUpdateEvent = updateDispatcher.createLateUpdateEvent("StateMachineLateUpdate")
    this.lateUpdateEvent.bind(() => {
      this.lateUpdate()
    })
  }

  destroy() {
    this.log.d("destroy")
    this._currentState = null
    this.lateUpdateEvent.enabled = false
    this.updateEvent.enabled = false
  }

  get currentState(): State | null {
    return this._currentState
  }

  get previousState(): State | null {
    return this._previousState
  }

  /**
   * Add a new state to the state machine.
   * @param config StateConfig. State names are Unique
   */
  addState(config: StateConfig): State {
    let newState = new State(config)
    this.states[newState.name] = newState
    this.stateCount++

    return newState
  }

  /**
   * Change states
   * @param stateName to enter
   * @param skipOnEnter set to true in order to call enterState without calling that state's onEnter() function
   */
  enterState(stateName: string, skipOnEnter = false) {
    if (this.states[stateName] === undefined) {
      //   this.log(`Invalid state ${stateName}`)
      return
    }

    let oldState = this._currentState
    if (oldState !== null) {
      this.exitState()
    }

    // this.log(`Entering State - ${stateName}`)
    let newState = this.states[stateName] as State
    this._previousState = this._currentState
    this._currentState = newState
    this._currentState.stateElapsedTime = 0
    this._currentState.stateStartTime = getTime()

    // Dispatch the state changed event
    this.onStateChanged.dispatch(this._currentState)

    if (skipOnEnter) {
      return
    }
    this._currentState.onEnter()
  }

  /**
   * Send a signal to the statemachine to possibly change states
   * @param signal name of the signal
   * @param data optional data
   */
  sendSignal(signal: string, data: any = null) {
    if (this._currentState === null) {
      // print(">>> CURRENT STATE IS NULL!")
      return
    }

    this._currentState.onSignal()

    let transition = this._currentState.checkSignal(signal, data)
    if (transition !== null) {
      // print(">>> EXECUTING TRANSITION!")
      this.executeTransition(transition)
    } else {
      // print(">>> NO TRANSITION FOUND!")

    }
  }

  private exitState() {
    if (this._currentState !== null) {
      //   this.log(`Exiting State - ${this._currentState.name}`)
      this._currentState.onExit()
    }
  }

  private executeTransition(transition: Transition) {
    // this.log(`Executing Transition to ${transition.nextStateName}`)
    if (transition.onExecution !== undefined) {
      // print(">>> CALLING onExecution!")
      transition.onExecution()
    } else {
      // print(">>> onExecution UNDEFINED!")

    }

    // print(">>> ENTERING NEXT STATE: " + transition.nextStateName)
    this.enterState(transition.nextStateName)
  }

  private update() {
    if (this._currentState === null) {
      return
    }

    this._currentState.stateElapsedTime = getTime() - this._currentState.stateStartTime

    let transition = this._currentState.checkUpdate()
    if (transition !== null) {
      this.executeTransition(transition)
    }

    this._currentState.onUpdate()
  }

  private lateUpdate() {
    if (this._currentState === null) {
      return
    }

    this._currentState.stateElapsedTime = getTime() - this._currentState.stateStartTime

    this._currentState.onLateUpdate()
  }
}
