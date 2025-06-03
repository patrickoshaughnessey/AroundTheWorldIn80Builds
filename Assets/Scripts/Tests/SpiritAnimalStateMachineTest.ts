import {SpiritAnimalController} from "../SpiritAnimalController"
import {IdleState} from "../SpiritAnimalStates/IdleState"
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton"

@component
export class SpiritAnimalStateMachineTest extends BaseScriptComponent {
    @input()
    spiritAnimalController: SpiritAnimalController

    @input()
    testFirstPathButton: PinchButton

    @input()
    testSecondPathButton: PinchButton

    @input()
    statusText: Text

    private testInProgress: boolean = false
    private testStartTime: number = 0
    private expectedTransitions: string[] = []
    private observedTransitions: string[] = []

    onAwake() {
        print("SpiritAnimalStateMachineTest initialized")
    }

    onStart() {
        if (this.testFirstPathButton) {
            this.testFirstPathButton.onButtonPinched.add(() => {
                if (!this.testInProgress) {
                    this.runTest(1)
                } else {
                    this.updateStatus("Test already in progress. Please wait.")
                }
            })
            print("Test first path button configured")
        }

        if (this.testSecondPathButton) {
            this.testSecondPathButton.onButtonPinched.add(() => {
                if (!this.testInProgress) {
                    this.runTest(2)
                } else {
                    this.updateStatus("Test already in progress. Please wait.")
                }
            })
            print("Test second path button configured")
        }

        // Set up state change listener
        if (this.spiritAnimalController && this.spiritAnimalController.spiritAnimalStateMachine) {
            this.spiritAnimalController.spiritAnimalStateMachine.onStateChanged.add((newState) => {
                if (this.testInProgress) {
                    this.observedTransitions.push(newState.name)
                    this.updateStatus(`Transitioned to: ${newState.name}`)

                    // Check if we've reached the end of the test
                    if (newState.name === IdleState.STATE_NAME && this.observedTransitions.length > 1) {
                        this.finishTest()
                    }
                }
            })
        }
    }

    runTest(pathNumber: number) {
        if (!this.spiritAnimalController) {
            this.updateStatus("ERROR: No SpiritAnimalController provided")
            return
        }

        if (!this.spiritAnimalController.spiritAnimalStateMachine) {
            this.updateStatus("ERROR: SpiritAnimalController has no state machine")
            return
        }

        // Reset test state
        this.testInProgress = true
        this.testStartTime = Date.now()
        this.observedTransitions = []

        this.updateStatus(`=== STARTING SPIRIT ANIMAL STATE MACHINE TEST (Path ${pathNumber}) ===`)
        print(`Current state: ${this.spiritAnimalController.spiritAnimalStateMachine.currentState?.name}`)

        if (pathNumber === 1) {
            this.testFirstPath()
        } else {
            this.testSecondPath()
        }
    }

    testFirstPath() {
        // Set expected transitions
        this.expectedTransitions = [
            IdleState.STATE_NAME,
            "FlyingToOtherAnimal",
            "TalkingToOtherAnimal",
            "FlyingBackToOwner",
            IdleState.STATE_NAME
        ]

        // Ensure we're in the Idle state
        if (this.spiritAnimalController.spiritAnimalStateMachine.currentState?.name !== IdleState.STATE_NAME) {
            print("Resetting to Idle state...")
            this.spiritAnimalController.spiritAnimalStateMachine.enterState(IdleState.STATE_NAME)
        }

        // Record initial state
        this.observedTransitions.push(this.spiritAnimalController.spiritAnimalStateMachine.currentState.name)

        // Trigger the FLY_TO_ANIMAL signal
        this.updateStatus("Sending FLY_TO_ANIMAL signal...")
        this.spiritAnimalController.spiritAnimalStateMachine.sendSignal("FLY_TO_ANIMAL")

        // The rest of the transitions will happen automatically due to the setTimeout calls in each state
        this.updateStatus("Test initiated. Watching state transitions...")
        print("Expected sequence: Idle -> FlyingToOtherAnimal -> TalkingToOtherAnimal -> FlyingBackToOwner -> Idle")
        print("This should take approximately 7 seconds to complete (2s + 3s + 2s)")
    }

    testSecondPath() {
        // Set expected transitions
        this.expectedTransitions = [
            IdleState.STATE_NAME,
            "WaitingForOtherAnimal",
            "TalkingToOtherAnimal",
            IdleState.STATE_NAME
        ]

        // Ensure we're in the Idle state
        if (this.spiritAnimalController.spiritAnimalStateMachine.currentState?.name !== IdleState.STATE_NAME) {
            print("Resetting to Idle state...")
            this.spiritAnimalController.spiritAnimalStateMachine.enterState(IdleState.STATE_NAME)
        }

        // Record initial state
        this.observedTransitions.push(this.spiritAnimalController.spiritAnimalStateMachine.currentState.name)

        // Trigger the RECEIVE_OTHER_ANIMAL signal
        this.updateStatus("Sending RECEIVE_OTHER_ANIMAL signal...")
        this.spiritAnimalController.spiritAnimalStateMachine.sendSignal("RECEIVE_OTHER_ANIMAL")

        // The rest of the transitions will happen automatically due to the setTimeout calls in each state
        this.updateStatus("Test initiated. Watching state transitions...")
        print("Expected sequence: Idle -> WaitingForOtherAnimal -> TalkingToOtherAnimal -> Idle")
        print("This should take approximately 5 seconds to complete (2s + 3s)")
    }

    finishTest() {
        this.testInProgress = false
        const testDuration = (Date.now() - this.testStartTime) / 1000

        print(`Test completed in ${testDuration.toFixed(1)} seconds`)
        print(`Observed transitions: ${this.observedTransitions.join(" -> ")}`)

        // Check if the observed transitions match the expected ones
        let testPassed = true
        if (this.observedTransitions.length !== this.expectedTransitions.length) {
            testPassed = false
        } else {
            for (let i = 0; i < this.expectedTransitions.length; i++) {
                if (this.observedTransitions[i] !== this.expectedTransitions[i]) {
                    testPassed = false
                    break
                }
            }
        }

        if (testPassed) {
            this.updateStatus(`✅ TEST PASSED in ${testDuration.toFixed(1)}s: All transitions occurred as expected`)
        } else {
            this.updateStatus(`❌ TEST FAILED in ${testDuration.toFixed(1)}s: Unexpected transitions`)
            print("Expected: " + this.expectedTransitions.join(" -> "))
            print("Observed: " + this.observedTransitions.join(" -> "))
        }
    }

    updateStatus(message: string) {
        print(message)
        if (this.statusText) {
            this.statusText.text = message
        }
    }
}
