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

test('renders loading dots below question mark while awaiting response', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(RobotEyes, {
      facePosition: facePos,
      isAwaitingResponse: true,
      isProcessing: false,
    })
  );
  assert.ok(html.includes('?'), 'question mark should be visible while awaiting');
  const dots = html.match(/class=\"loading-dot\"/g) || [];
  assert.strictEqual(dots.length, 3, 'should render exactly three loading dots');

  const questionIndex = html.indexOf('question-icon');
  const indicatorIndex = html.indexOf('processing-indicator');
  assert.ok(indicatorIndex > questionIndex, 'loading dots should appear below the question mark');
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
  assert.ok(
    html.includes('mouth-smile'),
    'static smiling mouth should be rendered'
  );
  assert.ok(!html.includes('?'), 'question mark should be hidden after response');
});

test('does not render question mark while processing audio', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(RobotEyes, {
      facePosition: facePos,
      isListening: true,
      isAwaitingResponse: true,
      isProcessing: true,
    })
  );

  assert.ok(!html.includes('question-icon'), 'question mark should be hidden during playback');
  assert.ok(
    html.includes('mouth-talk-open'),
    'robot mouth should remain visible while processing'
  );
});
