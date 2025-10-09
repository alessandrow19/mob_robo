const test = require('node:test');
const assert = require('node:assert');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Mock next/image to avoid Next.js specific behavior during tests
require.cache[require.resolve('next/image')] = {
  exports: {
    __esModule: true,
    default: (props) => React.createElement('img', props),
  },
};

const RobotEyes = require('../build/components/RobotEyes.js').default;

const facePos = { x: 0, y: 0, videoWidth: 0, videoHeight: 0 };

function renderRobotEyes(overrides = {}) {
  return ReactDOMServer.renderToString(
    React.createElement(RobotEyes, { facePosition: facePos, ...overrides })
  );
}

function assertFaceIsVisible(html) {
  assert.ok(
    html.includes('alt="Olho esquerdo"'),
    'left eye image should be rendered'
  );
  assert.ok(
    html.includes('alt="Olho direito"'),
    'right eye image should be rendered'
  );
  assert.ok(html.includes('alt="Boca"'), 'mouth image should be rendered');
  assert.ok(
    !html.includes('question-icon'),
    'question icon markup should no longer appear'
  );
}

test('keeps face visible while listening', () => {
  const html = renderRobotEyes({ isListening: true });
  assertFaceIsVisible(html);
});

test('keeps face visible while awaiting response', () => {
  const html = renderRobotEyes({ isAwaitingResponse: true });
  assertFaceIsVisible(html);
});

test('keeps face visible after finishing response', () => {
  const html = renderRobotEyes();
  assertFaceIsVisible(html);
});

test('keeps face visible while processing audio', () => {
  const html = renderRobotEyes({ isProcessing: true });
  assertFaceIsVisible(html);
});
