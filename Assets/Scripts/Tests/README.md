# Spirit Animal State Machine Testing

This document explains how the Spirit Animal State Machine was tested and how you can test it yourself.

## Testing Approach

The Spirit Animal State Machine was tested using a combination of:

1. **Automated Transitions**: Each state includes simulated delays using `setTimeout()` to automatically trigger the next transition after a specific time period. This simulates real events like animations completing or network events.

2. **Console Logging**: Extensive logging is implemented in each state to track state entry, exit, and transitions.

3. **Dedicated Test Script**: A `SpiritAnimalStateMachineTest` component that can be attached to a scene object to test both transition paths.

## How to Test

### Using the Test Script

1. Add the `SpiritAnimalStateMachineTest.ts` script to a scene object.

2. Set up the required references:
   - `spiritAnimalController`: Reference to the SpiritAnimalController instance
   - `testFirstPathButton`: A PinchButton to test the first transition path
   - `testSecondPathButton`: A PinchButton to test the second transition path
   - `statusText`: A TextComponent to display test status and results

3. Run the scene and press the test buttons to execute the tests:
   - **Test First Path**: Tests the sequence Idle → FlyingToOtherAnimal → TalkingToOtherAnimal → FlyingBackToOwner → Idle
   - **Test Second Path**: Tests the sequence Idle → WaitingForOtherAnimal → TalkingToOtherAnimal → Idle

4. Observe the test results in the console and status text:
   - The test will report whether it passed or failed
   - It will show the expected and actual transition sequences
   - It will report the time taken to complete the test

### Manual Testing

You can also test the state machine manually by:

1. Ensuring the SpiritAnimalController is properly initialized
2. Using the console to send signals to the state machine:
   ```typescript
   // Get the controller
   const controller = /* reference to SpiritAnimalController */;
   
   // Send signals to trigger transitions
   controller.spiritAnimalStateMachine.sendSignal("FLY_TO_ANIMAL");
   controller.spiritAnimalStateMachine.sendSignal("RECEIVE_OTHER_ANIMAL");
   ```

3. Observing the console logs to verify state transitions

## Expected Behavior

### First Path (Initiated Interaction)
1. Start in **Idle** state
2. Send "FLY_TO_ANIMAL" signal → Transition to **FlyingToOtherAnimal**
3. After 2 seconds → Transition to **TalkingToOtherAnimal**
4. After 3 seconds → Transition to **FlyingBackToOwner**
5. After 2 seconds → Return to **Idle**

### Second Path (Received Interaction)
1. Start in **Idle** state
2. Send "RECEIVE_OTHER_ANIMAL" signal → Transition to **WaitingForOtherAnimal**
3. After 2 seconds → Transition to **TalkingToOtherAnimal**
4. After 3 seconds → Return to **Idle**

## Troubleshooting

If the tests fail, check the following:

1. Ensure all state classes are properly registered with the state machine
2. Verify that the transition conditions are correctly defined
3. Check that the simulated delays are working properly
4. Confirm that the SpiritAnimalController is properly initialized

## Future Improvements

For a production implementation, consider:

1. Replacing the simulated delays with actual event triggers (animation completion, network events, etc.)
2. Adding more comprehensive error handling
3. Implementing more detailed state validation
4. Adding visual feedback for each state (animations, effects, etc.)