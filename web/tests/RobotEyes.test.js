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

test('renders face when not listening', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(RobotEyes, { facePosition: facePos, isListening: false })
  );
  assert.ok(html.includes('boca.png'), 'mouth image should be rendered');
  assert.ok(!html.includes('?'), 'question mark should be hidden');
});
