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

test('renders question mark while listening', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(RobotEyes, { facePosition: facePos, isListening: true })
  );
  assert.ok(html.includes('?'), 'question mark should be visible');
});

test('renders loading spinner while awaiting response', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(RobotEyes, {
      facePosition: facePos,
      isAwaitingResponse: true,
      isProcessing: false,
    })
  );
  assert.ok(html.includes('?'), 'question mark should be visible while awaiting');
  assert.ok(
    html.includes('loading-spinner'),
    'loading spinner should be rendered while awaiting'
  );
});

test('renders face after finishing response', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(RobotEyes, {
      facePosition: facePos,
      isListening: false,
      isAwaitingResponse: false,
      isProcessing: false,
    })
  );
  assert.ok(html.includes('boca.png'), 'mouth image should be rendered');
  assert.ok(!html.includes('?'), 'question mark should be hidden after response');
});
