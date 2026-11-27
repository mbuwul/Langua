/* Flashcards with spaced repetition.
   Cards come from window.DECK (built by build.py from the lessons): every Dutch|English word and every
   Rule / Pattern / Key idea box. Each word gives two cards: "Meaning" (see and hear the Dutch, recall the
   English) and "Say it" (see the English, say the Dutch aloud, then hear the model). The "Say it" card of
   a word only starts once its Meaning card has been learned.
   Scheduling works like Anki: Again / Hard / Good / Easy. New cards go through short learning steps
   (1 and 10 minutes), then come back after 1 day, and each later review multiplies the gap by the card's
   ease (about 2.5x for Good). Progress is stored in this browser (localStorage "nl-srs"). */
(function () {
  var mix = 0, DECK = window.DECK || [], MIN = 60000, DAY = 86400000, STEPS = [1, 10], RELEARN = 10;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v) } catch (e) { return null } }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() }
  function endOfDay() { var d = new Date(); d.setHours(23, 59, 59, 999); return +d }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }

  var S = { cards: {}, day: '', newToday: 0, newLimit: 20, extra: 0, types: { wm: true, ws: true, r: true }, auto: true };
  try { var raw = JSON.parse(store('nl-srs') || 'null'); if (raw) for (var k in raw) S[k] = raw[k] } catch (e) { }
  function save() { store('nl-srs', JSON.stringify(S)) }
  function rollDay() { if (S.day !== today()) { S.day = today(); S.newToday = 0; S.extra = 0; save() } }

  /* ---------- Which cards exist for this learner ---------- */
  function progress() { var P = { done: {}, parts: {} }; try { var r = JSON.parse(store('nl-progress') || 'null'); if (r) P = r } catch (e) { } return P }
  function openedUnits() { var P = progress(), o = {}; for (var a in (P.parts || {})) if (!P.parts[a].locked) o[a] = 1; for (var b in (P.done || {})) o[b] = 1; return o }
  var ALL = [];
  DECK.forEach(function (c, i) {
    if (c.t === 'w') {
      var key = hash(c.nl.toLowerCase());
      ALL.push({ id: 'wm' + key, type: 'wm', d: c, ord: i * 2, sib: null });
      ALL.push({ id: 'ws' + key, type: 'ws', d: c, ord: i * 2 + 1, sib: 'wm' + key });
    } else ALL.push({ id: 'r' + hash(c.label + c.html), type: 'r', d: c, ord: i * 2 });
  });
  function pool() { var o = openedUnits(); return ALL.filter(function (c) { return o[c.d.u] && S.types[c.type] !== false }) }
  function st(c) { return S.cards[c.id] }
  function isNewEligible(c) { if (st(c)) return false; if (!c.sib) return true; var s = S.cards[c.sib]; return !!(s && (s.s === 'review' || s.s === 'relearn')) }

  function summary() {
    rollDay(); var now = Date.now(), eod = endOfDay(), p = pool(), due = 0, learn = 0, nw = 0, known = 0, nextAt = null;
    p.forEach(function (c) {
      var s = st(c);
      if (!s) { if (isNewEligible(c)) nw++; return }
      if (s.s === 'review') { known++; if (s.due <= eod) due++; else if (!nextAt || s.due < nextAt) nextAt = s.due }
      else { if (s.due <= now) learn++; if (!nextAt || s.due < nextAt) nextAt = s.due }
    });
    var newLeft = Math.max(0, Math.min(nw, S.newLimit + S.extra - S.newToday));
    return { due: due, learn: learn, newLeft: newLeft, newAvail: nw, known: known, total: p.length, nextAt: nextAt, now: due + learn + newLeft };
  }

  /* ---------- Scheduling ---------- */
  function fuzz(d) { return d < 3 ? d : Math.round(d * (0.95 + Math.random() * 0.1)) }
  function preview(s) { /* returns [again, hard, good, easy] as {s,due,...} without saving */
    var now = Date.now(), out = [];
    for (var g = 0; g < 4; g++) {
      var n = s ? JSON.parse(JSON.stringify(s)) : { s: 'learn', step: 0, ease: 2.5, ivl: 0, lapses: 0, reps: 0 };
      n.reps = (n.reps || 0) + 1;
      if (n.s === 'learn') {
        if (g === 0) { n.step = 0; n.due = now + STEPS[0] * MIN }
        else if (g === 1) { n.due = now + (n.step === 0 ? 6 : STEPS[n.step]) * MIN }
        else if (g === 2) { if (n.step + 1 < STEPS.length) { n.step++; n.due = now + STEPS[n.step] * MIN } else { n.s = 'review'; n.ivl = 1; n.due = now + DAY } }
        else { n.s = 'review'; n.ivl = 4; n.due = now + 4 * DAY }
      } else if (n.s === 'relearn') {
        if (g < 2) n.due = now + RELEARN * MIN;
        else { n.s = 'review'; n.ivl = Math.max(1, n.ivl + (g === 3 ? 1 : 0)); n.due = now + n.ivl * DAY }
      } else {
        var iv = n.ivl || 1;
        if (g === 0) { n.lapses = (n.lapses || 0) + 1; n.ease = Math.max(1.3, n.ease - 0.2); n.ivl = Math.max(1, Math.round(iv * 0.5)); n.s = 'relearn'; n.due = now + RELEARN * MIN }
        else if (g === 1) { n.ease = Math.max(1.3, n.ease - 0.15); n.ivl = fuzz(Math.max(iv + 1, Math.round(iv * 1.2))); n.due = now + n.ivl * DAY }
        else if (g === 2) { n.ivl = fuzz(Math.max(iv + 1, Math.round(iv * n.ease))); n.due = now + n.ivl * DAY }
        else { n.ease = n.ease + 0.15; n.ivl = fuzz(Math.max(iv + 2, Math.round(iv * n.ease * 1.3))); n.due = now + n.ivl * DAY }
      }
      out.push(n);
    }
    return out;
  }
  function span(ms) {
    var m = Math.round(ms / MIN);
    if (m < 1) return '<1 min'; if (m < 60) return m + ' min';
    var h = Math.round(m / 60); if (h < 20) return h + ' h';
    var d = Math.round(ms / DAY); if (d < 1) d = 1; if (d < 14) return d + (d === 1 ? ' day' : ' days');
    if (d < 60) return Math.round(d / 7) + ' wk'; if (d < 365) return (Math.round(d / 3) / 10) + ' mo';
    return (Math.round(d / 36.5) / 10) + ' yr';
  }

  /* ---------- Queue ---------- */
  function nextCard(ahead) {
    rollDay(); var now = Date.now(), eod = endOfDay(), p = pool(), learn = [], rev = [], nw = [];
    p.forEach(function (c) {
      var s = st(c);
      if (!s) { if (isNewEligible(c)) nw.push(c); return }
      if (s.s === 'review') { if (s.due <= eod) rev.push(c) }
      else if (s.due <= now + (ahead ? 20 * MIN : 0)) learn.push(c);
    });
    learn.sort(function (a, b) { return st(a).due - st(b).due });
    if (learn.length && st(learn[0]).due <= now) return learn[0];
    rev.sort(function (a, b) { return st(a).due - st(b).due });
    var newLeft = S.newLimit + S.extra - S.newToday;
    nw.sort(function (a, b) { return a.ord - b.ord });
    /* mix: roughly one new card after every 3 reviews */
    if (rev.length && (!nw.length || newLeft <= 0 || ++mix % 4)) return rev[0];
    if (nw.length && newLeft > 0) return nw[0];
    if (rev.length) return rev[0];
    if (learn.length) return learn[0];
    return null;
  }

  /* ---------- Speech ---------- */
  function clean(t) { return String(t).replace(/\([^)]*\)/g, ' ').replace(/\.\.\.|…|___/g, ' ').replace(/[\/→=+]/g, ', ').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim() }
  var voice = null;
  function pickVoice() { try { var v = speechSynthesis.getVoices(); voice = v.filter(function (x) { return /^nl(-|_)NL/i.test(x.lang) })[0] || v.filter(function (x) { return /^nl/i.test(x.lang) })[0] || null } catch (e) { } }
  function say(t, btn) {
    if (!('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel() } catch (e) { }
    pickVoice(); var u = new SpeechSynthesisUtterance(clean(t)); u.lang = 'nl-NL'; u.rate = parseFloat(store('nl-rate')) || 0.8; if (voice) u.voice = voice;
    if (btn) { btn.classList.add('speaking'); u.onend = u.onerror = function () { btn.classList.remove('speaking') } }
    speechSynthesis.speak(u);
  }
  if ('speechSynthesis' in window) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice) } catch (e) { } }
  function norm(s) { return String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/\([^)]*\)/g, ' ').replace(/[.,!?;:"“”()\/]/g, ' ').replace(/\s+/g, ' ').trim() }

  /* ---------- Page ---------- */
  var I = {
    sp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'
  };
  var TYPES = { wm: 'Meaning', ws: 'Say it', r: 'Rule' };

  function mount(el, UP) {
    var card = null, shown = false, srState = null;
    function head() {
      var m = summary();
      return '<div class="fc-stats"><div><b>' + m.due + '</b><span>to review</span></div><div><b>' + m.learn + '</b><span>learning now</span></div>'
        + '<div><b>' + m.newLeft + '</b><span>new today</span></div><div><b>' + m.known + '</b><span>learned</span></div></div>'
        + '<div class="fc-filters" role="group" aria-label="Card types">' + Object.keys(TYPES).map(function (t) {
          return '<button type="button" class="chip-btn fc-type" data-t="' + t + '" aria-pressed="' + (S.types[t] !== false) + '">' + TYPES[t] + '</button>'
        }).join('') + '<label class="fc-limit">New cards a day <select class="fc-lim">' + [5, 10, 20, 30, 50].map(function (n) { return '<option' + (n === S.newLimit ? ' selected' : '') + '>' + n + '</option>' }).join('') + '</select></label>'
        + '<label class="fc-auto"><input type="checkbox" class="fc-autoplay"' + (S.auto ? ' checked' : '') + '> Play audio</label></div>';
    }
    function render() {
      card = nextCard(false); shown = false;
      var m = summary(), h = head();
      if (!m.total) {
        h += '<div class="fc-empty"><h3>No cards yet</h3><p>Cards appear as soon as you open a unit: its words, their pronunciation and its rules.</p><a class="btn-primary" href="' + UP + 'index.html">Go to your next unit</a></div>';
        el.innerHTML = h; wire(); return;
      }
      if (!card) {
        var soon = m.nextAt && m.nextAt - Date.now() < 20 * MIN;
        h += '<div class="fc-empty"><h3>All caught up</h3><p>' + (m.nextAt ? 'Next card in ' + span(Math.max(0, m.nextAt - Date.now())) + '.' : 'You have seen every card from the units you opened.')
          + (m.newAvail ? ' ' + m.newAvail + ' new cards are waiting for another day.' : ' Open the next unit to get new cards.') + '</p><div class="fc-empty-btns">'
          + (soon ? '<button type="button" class="btn-primary fc-ahead">Study the waiting cards now</button>' : '')
          + (m.newAvail ? '<button type="button" class="btn-sec fc-more">Learn 10 more new cards</button>' : '') + '</div></div>';
        el.innerHTML = h; wire(); return;
      }
      el.innerHTML = h + '<div class="fc-card-wrap"></div>'; wire(); face();
    }
    function front(c) {
      var d = c.d;
      if (c.type === 'wm') return '<p class="fc-q">What does this mean?</p><div class="fc-big nl"><button type="button" class="speak fc-say" aria-label="Listen">' + I.sp + '</button><span>' + esc(d.nl) + '</span></div>';
      if (c.type === 'ws') return '<p class="fc-q">Say it in Dutch, out loud</p><div class="fc-big">' + esc(d.en) + '</div>'
        + ((window.SpeechRecognition || window.webkitSpeechRecognition) ? '<div class="fc-mic"><button type="button" class="btn-sec fc-micbtn">' + I.mic + '<span>Say it</span></button><span class="fc-heard" aria-live="polite"></span></div>' : '<p class="fc-hint">Say it aloud, then check.</p>');
      var t = ruleParts(d);
      return '<p class="fc-q">' + esc(d.sec ? d.sec + ' · ' : '') + 'Fill in the rule</p><div class="fc-rule"><b class="fc-rl">' + esc(t.label) + (t.title ? ': <span class="blank">' + blanks(t.title) + '</span>' : '') + '</b> ' + t.cloze + '</div>';
    }
    function back(c) {
      var d = c.d;
      if (c.type === 'wm') return '<div class="fc-ans">' + esc(d.en) + '</div>';
      if (c.type === 'ws') return '<div class="fc-ans nl"><button type="button" class="speak fc-say" aria-label="Listen">' + I.sp + '</button><span>' + esc(d.nl) + '</span></div><div class="fc-score"></div>';
      var t = ruleParts(d);
      return '<div class="fc-rule fc-ans-rule"><b class="fc-rl">' + esc(t.label) + (t.title ? ': ' + esc(t.title) : '') + '</b> ' + d.html + '</div>';
    }
    function blanks(s) { return s.split(/\s+/).map(function (w) { return '<i>' + '_'.repeat(Math.min(10, Math.max(3, w.length))) + '</i>' }).join(' ') }
    function ruleParts(d) {
      var m = d.label.match(/^((?:Rule|Pattern|Key idea)(?:\s*\d+)?)\s*:?\s*(.*)$/i), label = m ? m[1] : d.label, title = m ? m[2] : '';
      var hasBold = /<b>/.test(d.html), cloze = d.html.replace(/<b>(.*?)<\/b>/g, function (x, w) { return '<span class="blank">' + blanks(w.replace(/<[^>]+>/g, '')) + '</span>' });
      if (!hasBold && !title) cloze = '<span class="fc-hint">Try to say the rule in your own words.</span>';
      return { label: label, title: title, cloze: cloze };
    }
    function face() {
      var w = el.querySelector('.fc-card-wrap'), c = card, s = st(c), pv = preview(s);
      var tag = '<div class="fc-tags"><span class="pill">' + TYPES[c.type] + '</span><span class="pill">' + esc(c.d.u) + '</span>' + (!s ? '<span class="pill new">New</span>' : s.s !== 'review' ? '<span class="pill learn">Learning</span>' : '') + '</div>';
      w.innerHTML = '<article class="fc-card' + (shown ? ' shown' : '') + '">' + tag + '<div class="fc-front">' + front(c) + '</div>'
        + (shown ? '<hr><div class="fc-back">' + back(c) + '</div>' : '') + '</article>'
        + (shown ? '<div class="fc-grade">' + ['Again', 'Hard', 'Good', 'Easy'].map(function (g, i) {
          return '<button type="button" class="fc-g g' + i + '" data-g="' + i + '"><b>' + g + '</b><small>' + span(pv[i].due - Date.now()) + '</small></button>'
        }).join('') + '</div><p class="fc-keys">Keys: 1 Again · 2 Hard · 3 Good · 4 Easy</p>'
          : '<div class="fc-show"><button type="button" class="btn-primary fc-flip">Show answer</button><p class="fc-keys">or press Space</p></div>');
      if (S.auto && ((c.type === 'wm' && !shown) || (c.type === 'ws' && shown))) say(c.d.nl);
      if (shown && c.type === 'ws' && srState) scoreSaid();
    }
    function scoreSaid() {
      var box = el.querySelector('.fc-score'); if (!box || !srState) return;
      var tw = norm(card.d.nl).split(' '), best = 0;
      srState.forEach(function (h) { var pool = norm(h).split(' '), hit = tw.filter(function (w) { var k = pool.indexOf(w); if (k >= 0) { pool.splice(k, 1); return true } return false }).length; best = Math.max(best, hit / tw.length) });
      var pct = Math.round(best * 100);
      box.innerHTML = '<span class="' + (pct >= 80 ? 'ok' : 'no') + '">Your pronunciation: ' + pct + '% match</span>' + (pct >= 80 ? '' : ' · listen and repeat');
      var sug = el.querySelector('.fc-g.g' + (pct >= 100 ? 2 : pct >= 80 ? 1 : 0)); if (sug) sug.classList.add('suggest');
    }
    function grade(g) {
      var pv = preview(st(card));
      if (!st(card)) S.newToday++;
      S.cards[card.id] = pv[g]; save(); srState = null; render();
      if (window.NLCards && NLCards.onChange) NLCards.onChange();
    }
    function listen(btn) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition, out = el.querySelector('.fc-heard');
      try { speechSynthesis.cancel() } catch (e) { }
      var r = new SR(); r.lang = 'nl-NL'; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
      btn.classList.add('listening'); btn.querySelector('span').textContent = 'Listening…'; out.textContent = 'Speak now.';
      r.onresult = function (e) { var a = []; for (var i = 0; i < e.results[0].length; i++)a.push(e.results[0][i].transcript); srState = a; out.textContent = 'Heard: “' + a[0] + '”. Now show the answer.' };
      r.onerror = function (e) { out.textContent = e.error === 'no-speech' ? 'I heard nothing. Try again.' : e.error === 'network' ? 'The speech check needs internet.' : /not-allowed/.test(e.error) ? 'Allow the microphone to use the speech check.' : 'Microphone problem (' + e.error + ').' };
      r.onend = function () { btn.classList.remove('listening'); btn.querySelector('span').textContent = 'Say it again' };
      try { r.start() } catch (e) { out.textContent = 'Could not start the microphone.' }
    }
    function wire() {
      el.querySelectorAll('.fc-type').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-t'); S.types[t] = S.types[t] === false; save(); render() } });
      var lim = el.querySelector('.fc-lim'); if (lim) lim.onchange = function () { S.newLimit = +lim.value; save(); render() };
      var ap = el.querySelector('.fc-autoplay'); if (ap) ap.onchange = function () { S.auto = ap.checked; save() };
      var more = el.querySelector('.fc-more'); if (more) more.onclick = function () { S.extra += 10; save(); render() };
      var ah = el.querySelector('.fc-ahead'); if (ah) ah.onclick = function () { card = nextCard(true); if (card) { shown = false; el.querySelector('.fc-empty').outerHTML = '<div class="fc-card-wrap"></div>'; face() } };
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !card) return;
      if (b.classList.contains('fc-flip')) { shown = true; face() }
      else if (b.classList.contains('fc-g')) grade(+b.getAttribute('data-g'));
      else if (b.classList.contains('fc-say')) say(card.d.nl, b);
      else if (b.classList.contains('fc-micbtn')) listen(b);
    });
    document.addEventListener('keydown', function (e) {
      if (!card || /input|select|textarea/i.test((e.target.tagName || ''))) return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); shown = true; face() }
      else if (shown && /^[1-4]$/.test(e.key)) grade(+e.key - 1);
    });
    render();
  }

  window.NLCards = { summary: summary, mount: mount, unitCards: function (u) { return DECK.filter(function (c) { return c.u === u }) } };
})();
