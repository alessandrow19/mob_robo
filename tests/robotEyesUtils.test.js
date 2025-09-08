const test = require('node:test');
const assert = require('node:assert');
const {
  calculateEyePosition,
  determineExpression,
  getExpressionStyles
} = require('../build/components/robotEyesUtils.js');

test('centers eyes when no face detected', () => {
  const { offsetX, offsetY } = calculateEyePosition(0, 0, 720, 560);
  assert.strictEqual(offsetX, 0);
  assert.strictEqual(offsetY, 0);
});

test('offsets stay within horizontal bounds', () => {
  const { offsetX } = calculateEyePosition(720, 280, 720, 560);
  assert.ok(offsetX <= 75 && offsetX >= -75);
});

test('offsets stay within vertical bounds', () => {
  const { offsetY } = calculateEyePosition(360, 560, 720, 560);
  assert.ok(offsetY <= 22.5 && offsetY >= -22.5);
});

test('detects funny expression when face present', () => {
  assert.strictEqual(determineExpression(10, 10), 'funny');
});

test('expression styles avoid scaling', () => {
  const styles = getExpressionStyles('funny');
  assert.ok(!('transform' in styles));
});
