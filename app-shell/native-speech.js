/* Langua Android app: native speech bridge.
   Android's built-in WebView has no Web Speech recognition and an unreliable speech voice,
   so inside the app this file replaces window.SpeechRecognition and window.speechSynthesis
   with versions that use the phone's own (free) Google speech services through Capacitor plugins.
   The course code (assets/app.js) keeps using the normal Web Speech API and does not need to change.
   Loaded only in the app build, before app.js. */
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var reg = function (n) { return (C.registerPlugin ? C.registerPlugin(n) : (C.Plugins || {})[n]); };
  var SRP = reg('SpeechRecognition'), TTS = reg('TextToSpeech');
  /* The app's own speech plugin (since 1.0.9): waits through pauses and retries a failed first start.
     Older app versions fall back to the community plugin. */
  var LS = C.isPluginAvailable && C.isPluginAvailable('LanguaSpeech') ? reg('LanguaSpeech') : null;

  /* ---------- Speech recognition ---------- */
  function errCode(msg) {
    msg = String((msg && (msg.message || msg.errorMessage)) || msg || '');
    if (/permission/i.test(msg)) return 'not-allowed';
    /* Android says "No match" when it heard speech but could not turn it into Dutch words:
       that is a wrong or unclear answer, not silence. Only "No speech input" means silence. */
    if (/no match|didn.t understand/i.test(msg)) return 'no-match';
    if (/no speech/i.test(msg)) return 'no-speech';
    if (/network|server/i.test(msg)) return 'network';
    if (/audio/i.test(msg)) return 'audio-capture';
    if (/not available|unavailable|unimplemented/i.test(msg)) return 'service-not-allowed';
    if (/busy/i.test(msg)) return 'aborted';
    return msg || 'aborted';
  }
  function NativeSR() {
    this.lang = 'nl-NL'; this.maxAlternatives = 5; this.interimResults = false; this.continuous = false;
    this.onresult = this.onerror = this.onend = this.onstart = null; this._on = false; this._ended = false;
  }
  NativeSR.prototype._fire = function (name, ev) { var f = this['on' + name]; if (typeof f === 'function') { try { f.call(this, ev) } catch (e) { console.error(e) } } };
  NativeSR.prototype._end = function () { if (this._ended) return; this._ended = true; this._on = false; this._fire('end', { type: 'end' }); };
  NativeSR.prototype.start = function () {
    if (this._on) throw new Error('InvalidStateError: already started');
    var me = this; me._on = true; me._ended = false;
    if (LS) {
      me._fire('start', { type: 'start' });
      LS.start({ language: me.lang || 'nl-NL', maxResults: me.maxAlternatives || 5, maxMs: 15000, silenceMs: 1500 }).then(function (res) {
        var m = (res && res.matches) || [];
        if (!m.length) { me._fire('error', { type: 'error', error: 'no-match' }); return; }
        var alts = m.map(function (t, i) { return { transcript: t, confidence: i === 0 ? 0.9 : 0.5 }; }); alts.isFinal = true;
        me._fire('result', { type: 'result', resultIndex: 0, results: [alts] });
      }).catch(function (e) {
        var c = e && e.code; me._fire('error', { type: 'error', error: /^(no-speech|no-match|network|not-allowed|service-not-allowed|audio-capture|aborted)$/.test(c) ? c : errCode(e) });
      }).then(function () { me._end(); });
      return;
    }
    var ask = SRP.checkPermissions().then(function (p) {
      if (p && p.speechRecognition === 'granted') return p;
      return SRP.requestPermissions();
    });
    ask.then(function (p) {
      if (!p || p.speechRecognition !== 'granted') throw { message: 'Missing permission' };
      if (!me._on) return null; /* stopped while the permission box was open */
      me._fire('start', { type: 'start' });
      return SRP.start({ language: me.lang || 'nl-NL', maxResults: me.maxAlternatives || 5, partialResults: false, popup: false });
    }).then(function (res) {
      if (res === null) return;
      var m = (res && res.matches) || [];
      if (!m.length) { me._fire('error', { type: 'error', error: 'no-match' }); return; }
      var alts = m.map(function (t, i) { return { transcript: t, confidence: i === 0 ? 0.9 : 0.5 }; });
      alts.isFinal = true;
      me._fire('result', { type: 'result', resultIndex: 0, results: [alts] });
    }).catch(function (e) {
      me._fire('error', { type: 'error', error: errCode(e), message: String((e && e.message) || e) });
    }).then(function () { me._end(); });
  };
  NativeSR.prototype.stop = function () {
    /* The recogniser then delivers what it heard (onresult) and finishes (onend). */
    if (!this._on) return; try { (LS || SRP).stop() } catch (e) {}
    var me = this; setTimeout(function () { me._end(); }, 4000); /* safety net */
  };
  NativeSR.prototype.abort = function () {
    if (!this._on) return; try { (LS || SRP).stop() } catch (e) {}
    this._fire('error', { type: 'error', error: 'aborted' }); this._end();
  };
  NativeSR.prototype.addEventListener = function (n, f) { this['on' + n] = f; };
  window.SpeechRecognition = window.webkitSpeechRecognition = NativeSR;

  /* ---------- Speech synthesis (the listen buttons) ---------- */
  function Utt(text) {
    this.text = text || ''; this.lang = 'nl-NL'; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null;
    this.onstart = this.onend = this.onerror = null;
  }
  Utt.prototype.addEventListener = function (n, f) { this['on' + n] = f; };
  var voices = [], queue = [], busy = false, gen = 0;
  var synth = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: function () { return voices.slice(); },
    speak: function (u) { queue.push(u); synth.pending = true; if (!busy) next(); },
    cancel: function () { gen++; queue = []; busy = false; synth.speaking = synth.pending = false; TTS.stop().catch(function () {}); },
    pause: function () {}, resume: function () {},
    addEventListener: function (n, f) { if (n === 'voiceschanged') synth.onvoiceschanged = f; }
  };
  function call(u, n) { var f = u['on' + n]; if (typeof f === 'function') { try { f.call(u, { type: n, utterance: u }) } catch (e) { console.error(e) } } }
  function next() {
    var u = queue.shift(); synth.pending = queue.length > 0;
    if (!u) { busy = false; synth.speaking = false; return; }
    busy = true; synth.speaking = true; var my = gen; call(u, 'start');
    var opts = { text: u.text, lang: (u.voice && u.voice.lang) || u.lang || 'nl-NL', rate: u.rate || 1, pitch: u.pitch || 1, volume: u.volume == null ? 1 : u.volume, queueStrategy: 1 };
    if (u.voice && typeof u.voice._i === 'number') opts.voice = u.voice._i;
    TTS.speak(opts).then(function () { if (my !== gen) return; call(u, 'end'); next(); },
      function () { if (my !== gen) return; call(u, 'error'); next(); });
  }
  function loadVoices() {
    TTS.getSupportedVoices().then(function (r) {
      voices = ((r && r.voices) || []).map(function (v, i) {
        return { name: v.name, lang: String(v.lang || '').replace('_', '-'), voiceURI: v.voiceURI || v.name, localService: v.localService !== false, default: !!v.default, _i: i };
      });
      if (typeof synth.onvoiceschanged === 'function') synth.onvoiceschanged({ type: 'voiceschanged' });
    }).catch(function () {});
  }
  try { Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true }); } catch (e) { window.speechSynthesis = synth; }
  window.SpeechSynthesisUtterance = Utt;
  loadVoices(); setTimeout(loadVoices, 1500);

  /* If the phone has no Dutch voice yet, offer to install it once. */
  TTS.isLanguageSupported({ lang: 'nl-NL' }).then(function (r) {
    if (r && r.supported === false) {
      try { if (localStorage.getItem('nl-tts-asked')) return; localStorage.setItem('nl-tts-asked', '1'); } catch (e) {}
      if (confirm('Your phone has no Dutch voice yet. Open the voice settings to install Dutch (free)?')) TTS.openInstall().catch(function () {});
    }
  }).catch(function () {});

  document.documentElement.classList.add('in-app');
})();
