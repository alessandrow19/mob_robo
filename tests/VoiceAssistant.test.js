const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const pollinationsMockPath = path.resolve(
  __dirname,
  '../build/utils/pollinations.js'
);

require.cache[pollinationsMockPath] = {
  id: pollinationsMockPath,
  filename: pollinationsMockPath,
  loaded: true,
  exports: {
    getVoiceUrl: (prompt) => `mock-url:${prompt}`,
  },
};

const {
  fetchAndPlayPollinationsAudio,
} = require('../build/components/VoiceAssistant.js');

test('plays the fetched audio response until completion', async () => {
  const fetchCalls = [];
  const events = [];

  const fakeFetch = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      blob: async () => ({ size: 12 }),
    };
  };

  const revokedUrls = [];
  const urlCreator = {
    createObjectURL: () => 'blob:fake',
    revokeObjectURL: (url) => revokedUrls.push(url),
  };

  class MockAudio {
    constructor(url) {
      this.url = url;
      this.playCalls = 0;
      this._onended = null;
    }

    set onended(handler) {
      this._onended = handler;
    }

    get onended() {
      return this._onended;
    }

    play() {
      this.playCalls += 1;
      return Promise.resolve();
    }

    pause() {
      events.push('paused');
    }

    triggerEnd() {
      if (this._onended) {
        this._onended();
      }
    }
  }

  const audio = await fetchAndPlayPollinationsAudio(
    'Pergunta?',
    {
      fetchImpl: fakeFetch,
      AudioClass: MockAudio,
      urlCreator,
      getVoiceUrlFn: (prompt) => `mock-url:${prompt}`,
    },
    {
      onResponsePendingEnd: () => events.push('pending-end'),
      onAudioStart: () => events.push('audio-start'),
      onPlaybackComplete: () => events.push('playback-complete'),
    }
  );

  assert.ok(audio instanceof MockAudio, 'should return the created audio instance');
  assert.strictEqual(audio.url, 'blob:fake', 'audio should use the generated blob URL');
  assert.strictEqual(audio.playCalls, 1, 'audio should start playing exactly once');
  assert.deepStrictEqual(fetchCalls, [
    {
      url: 'mock-url:Pergunta?',
      options: {
        headers: {
          Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
          Authorization: 'Bearer sc6EZeTBRIf51QHl',
        },
        cache: 'no-store',
        mode: 'cors',
      },
    },
  ]);
  assert.deepStrictEqual(revokedUrls, [], 'URL should not be revoked before playback ends');
  assert.ok(
    events.includes('pending-end') && events.includes('audio-start'),
    'callbacks for pending end and audio start should be triggered'
  );
  assert.ok(
    !events.includes('playback-complete'),
    'playback completion should not fire before the audio ends'
  );

  audio.triggerEnd();

  assert.deepStrictEqual(
    revokedUrls,
    ['blob:fake'],
    'URL should be revoked once playback finishes'
  );
  assert.ok(
    events.includes('playback-complete'),
    'playback completion should trigger after the audio ends'
  );
});
