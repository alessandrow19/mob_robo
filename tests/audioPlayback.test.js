const test = require('node:test');
const assert = require('node:assert');

const originalURL = global.URL;
const revokedUrls = [];

global.URL = {
  createObjectURL: () => 'blob:stub',
  revokeObjectURL: (url) => revokedUrls.push(url),
};

const { playAudioResponse } = require('../build/utils/audioPlayback.js');

test.after(() => {
  global.URL = originalURL;
});

test('playAudioResponse waits for natural end of playback', async () => {
  revokedUrls.length = 0;
  const events = [];
  let endHandler = null;

  const fakeAudio = {
    play: () => {
      events.push('play-called');
      return new Promise((resolve) => {
        setTimeout(() => {
          events.push('play-resolved');
          resolve();
        }, 0);
      });
    },
    set onended(handler) {
      endHandler = handler;
    },
    get onended() {
      return endHandler;
    },
  };

  await playAudioResponse({
    audio: fakeAudio,
    url: 'blob:voice-success',
    onAudioStart: () => events.push('audio-start'),
    onResponsePendingEnd: () => events.push('pending-end'),
    onPlaybackFinished: () => events.push('finished'),
  });

  assert.deepStrictEqual(events.slice(0, 4), [
    'pending-end',
    'play-called',
    'play-resolved',
    'audio-start',
  ]);
  assert.ok(!events.includes('finished'), 'playback should not finish before onended');

  assert.ok(endHandler, 'onended handler should be registered');
  endHandler();

  assert.ok(events.includes('finished'), 'playback should finish after onended');
  assert.deepStrictEqual(revokedUrls, ['blob:voice-success']);
});

test('playAudioResponse propagates playback failures without finishing', async () => {
  revokedUrls.length = 0;
  let endHandler = null;
  let finishedCalled = false;

  const failingAudio = {
    play: () => {
      return Promise.reject(new Error('blocked by browser'));
    },
    set onended(handler) {
      endHandler = handler;
    },
    get onended() {
      return endHandler;
    },
  };

  await assert.rejects(
    playAudioResponse({
      audio: failingAudio,
      url: 'blob:voice-error',
      onPlaybackFinished: () => {
        finishedCalled = true;
      },
    })
  );

  assert.strictEqual(endHandler, null, 'onended should be cleared when playback fails');
  assert.ok(!finishedCalled, 'onPlaybackFinished must not run on failure');
  assert.deepStrictEqual(revokedUrls, ['blob:voice-error']);
});
