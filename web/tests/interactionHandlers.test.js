const test = require('node:test');
const assert = require('node:assert');

const {
  handleSmileInteraction,
  handleAngryInteraction,
} = require('../build/utils/interactionHandlers.js');

test('handleSmileInteraction activates listening when idle', () => {
  let isListening = false;
  let listenTrigger = 0;

  handleSmileInteraction(
    isListening,
    (val) => {
      isListening = val;
    },
    (updater) => {
      listenTrigger = updater(listenTrigger);
    }
  );

  assert.strictEqual(isListening, true, 'should set listening state');
  assert.strictEqual(listenTrigger, 1, 'should increment listen trigger');
});

test('handleSmileInteraction does nothing when already listening', () => {
  let setListeningCalled = false;
  let triggerCalled = false;

  handleSmileInteraction(
    true,
    () => {
      setListeningCalled = true;
    },
    () => {
      triggerCalled = true;
    }
  );

  assert.ok(!setListeningCalled, 'should not change listening state');
  assert.ok(!triggerCalled, 'should not trigger again');
});

test('handleAngryInteraction triggers stop when listening', () => {
  let stopTrigger = 0;

  handleAngryInteraction(true, (updater) => {
    stopTrigger = updater(stopTrigger);
  });

  assert.strictEqual(stopTrigger, 1, 'should increment stop trigger');
});

test('handleAngryInteraction does nothing when not listening', () => {
  let called = false;

  handleAngryInteraction(false, () => {
    called = true;
  });

  assert.ok(!called, 'should not increment when idle');
});

