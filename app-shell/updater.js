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

  /* Checks the newest release. force: ignore the "checked recently" and "Later" pauses (the dashboard button).
     Resolves with a short status line for the dashboard. */
  function check(force) {
    if (busy) return Promise.resolve('Already checking…');
    if (!force && Date.now() - (+store('nl-upd-check') || 0) < 60000) return Promise.resolve('');
    busy = true; store('nl-upd-check', String(Date.now()));
    return Promise.all([U.current(), getJSON(FEED + '?t=' + Date.now())]).then(function (r) {
      var cur = r[0] || {}, info = r[1] || {};
      if (!info.build) return 'Could not read the update information.';
      if (info.build <= BUILD) return 'You have the newest version.';
      var mine = nativeHash(cur.native);
      if (info.nativeHash && info.nativeHash !== mine) {
        /* A new APK is needed. After "Later", ask again an hour later (or at once from the button). */
        if (force || Date.now() - (+store('nl-upd-later') || 0) > 3600000)
          bar('A new version of the app (' + info.version + ') is ready.', 'Update the app', function () { window.location.href = info.apk }, true);
        return 'Version ' + info.version + ' is ready: tap Update the app.';
      }
      /* Already downloaded? Then just make sure it is set for next launch. */
      return U.list().then(function (l) {
        var got = (l && l.bundles || []).filter(function (b) { return b.version === info.version && b.status !== 'error' })[0];
        return got || U.download({ url: info.zip, version: info.version });
      }).then(function (bundle) {
        return U.next({ id: bundle.id }).then(function () {
          bar('New lessons and improvements (' + info.version + ') are ready.', 'Restart now', function (b) { b.remove(); U.set({ id: bundle.id }) }, true);
          return 'Version ' + info.version + ' downloaded: tap Restart now.';
        });
      });
    }).catch(function (e) { console.log('[updater] ' + (e && e.message || e)); return 'Could not check for updates (' + (e && e.message || e) + '). Are you online?' })
      .then(function (msg) { busy = false; return msg });
  }

  setTimeout(function () { check(false) }, 2000);
  try { A.addListener('resume', function () { setTimeout(function () { check(false) }, 800) }) } catch (e) { }

  /* Dashboard: show the app version and a "Check for updates" button. */
  function dash() {
    if (document.body.getAttribute('data-code') !== 'home') return;
    var main = document.querySelector('.main'); if (!main) return;
    var p = document.createElement('p'); p.className = 'upd-ver';
    U.current().then(function (c) {
      p.innerHTML = '<span>Langua Dutch ' + (window.LANGUA_VERSION || '') + ' <small>(app ' + String(c.native || '').split('+')[0] + ')</small></span> <button type="button" class="upd-check">Check for updates</button><span class="upd-msg" aria-live="polite"></span>';
      main.appendChild(p);
      var btn = p.querySelector('.upd-check'), msg = p.querySelector('.upd-msg');
      btn.onclick = function () { msg.textContent = 'Checking…'; check(true).then(function (m) { msg.textContent = m }) };
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dash); else dash();
})();
