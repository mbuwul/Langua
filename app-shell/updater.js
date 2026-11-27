/* Langua Android app: in-app updates (loaded only in the app).
   Every GitHub release publishes update.json, www.zip (the course pages) and the APK.
   - New lessons and fixes (www.zip) download quietly in the background and are used the next time the
     app opens, or straight away if the learner taps "Restart now". No download from the browser needed.
   - When the app's own Android part changed (new plugins, permissions), the web update could need it, so
     instead the learner sees "Update the app", which downloads and installs the new APK (Android always
     asks the learner to confirm an install from outside the Play Store).
   Uses the open-source @capgo/capacitor-updater in manual mode; nothing is sent to Capgo's servers. */
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var U = C.registerPlugin('CapacitorUpdater'), H = C.registerPlugin('CapacitorHttp'), A = C.registerPlugin('App');
  var FEED = 'https://github.com/mbuwul/Langua/releases/latest/download/update.json';
  var BUILD = window.LANGUA_BUILD || 0, busy = false;

  U.notifyAppReady().catch(function () {}); /* this bundle works: don't roll it back */

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v) } catch (e) { return null } }
  function nativeHash(v) { var m = String(v || '').match(/\+([0-9a-z]+)/i); return m ? m[1] : '' }

  function bar(text, btn, onBtn, later) {
    var old = document.querySelector('.upd-bar'); if (old) old.remove();
    var b = document.createElement('div'); b.className = 'upd-bar'; b.setAttribute('role', 'status');
    b.innerHTML = '<span class="upd-t"></span><span class="upd-btns">' + (later ? '<button type="button" class="upd-later">Later</button>' : '') + '<button type="button" class="upd-go"></button></span>';
    b.querySelector('.upd-t').textContent = text; b.querySelector('.upd-go').textContent = btn;
    b.querySelector('.upd-go').onclick = function () { onBtn(b) };
    var l = b.querySelector('.upd-later'); if (l) l.onclick = function () { b.remove(); store('nl-upd-later', String(Date.now())) };
    document.body.appendChild(b);
  }

  function getJSON(url) {
    return H.get({ url: url, headers: { 'Cache-Control': 'no-cache' }, responseType: 'json' }).then(function (r) {
      if (!r || r.status >= 400) throw new Error('HTTP ' + (r && r.status));
      return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
    });
  }

  function check() {
    /* at most every 10 minutes, across page changes */
    if (busy || Date.now() - (+store('nl-upd-check') || 0) < 10 * 60000) return;
    busy = true; store('nl-upd-check', String(Date.now()));
    Promise.all([U.current(), getJSON(FEED + '?t=' + Date.now())]).then(function (r) {
      var cur = r[0] || {}, info = r[1] || {};
      if (!info.build || info.build <= BUILD) return;
      var mine = nativeHash(cur.native);
      if (info.nativeHash && mine && info.nativeHash !== mine) {
        /* A new APK is needed. Ask at most once a day. */
        if (Date.now() - (+store('nl-upd-later') || 0) < 86400000) return;
        bar('A new version of the app is ready.', 'Update the app', function () { window.location.href = info.apk }, true);
        return;
      }
      /* Already downloaded? Then just make sure it is set for next launch. */
      return U.list().then(function (l) {
        var got = (l && l.bundles || []).filter(function (b) { return b.version === info.version && b.status !== 'error' })[0];
        return got || U.download({ url: info.zip, version: info.version });
      }).then(function (bundle) {
        return U.next({ id: bundle.id }).then(function () {
          bar('New lessons and improvements are ready.', 'Restart now', function (b) { b.remove(); U.set({ id: bundle.id }) }, true);
        });
      });
    }).catch(function (e) { console.log('[updater] ' + (e && e.message || e)) })
      .then(function () { busy = false });
  }

  setTimeout(check, 2500);
  try { A.addListener('resume', function () { setTimeout(check, 1000) }) } catch (e) { }
})();
