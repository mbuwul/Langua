#!/usr/bin/env python3
"""Build the Dutch course site: src/**/*.md -> site/**/*.html, plus the dashboard (site/index.html) and site/assets/.
Usage: python3 build.py"""
import os, re, html, json, shutil, subprocess, datetime

BASE = os.path.dirname(os.path.abspath(__file__))
SRC, SITE = os.path.join(BASE, 'src'), os.path.join(BASE, 'site')
LEVELS = [
    ('A0', 'Foundations', 'How Dutch works: sounds, spelling and the skeleton of every sentence.', 40),
    ('A1', 'Beginner', 'Shops, transport, forms and introductions.', 100),
    ('A2', 'Elementary', 'Your past, work and health; short messages.', 160),
    ('B1', 'Intermediate', 'Work in a Dutch team, follow the news, write emails.', 220),
    ('B2', 'Upper intermediate', 'University and professional Dutch.', 300),
    ('C1', 'Advanced', 'Research papers, presentations, academic writing.', 350),
]
EXAMS = {'A0': 'Foundations check', 'A1': 'Basisexamen Inburgering Buitenland', 'A2': 'Inburgeringsexamen A2, CNaVT A2',
         'B1': 'Inburgeringsexamen B1, Staatsexamen NT2 I, CNaVT B1, ITNA B1', 'B2': 'Staatsexamen NT2 II, CNaVT B2, ITNA B2', 'C1': 'CNaVT C1 + capstone'}
STAMP = datetime.datetime.now(datetime.timezone.utc).strftime('%d %b %Y, %H:%M UTC')
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:ital,wght@0,400..700;1,400&family=JetBrains+Mono:wght@500;600;700&display=swap">')
# Colour mode and design are set before the page paints. Each design loads its own fonts.
DESIGN_FONTS = {
    'paper': 'family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..600&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400',
    'arcade': 'family=Nunito:ital,wght@0,500..900;1,600',
}
THEME_INIT = ("<script>try{var d=document.documentElement,t=localStorage.getItem('nl-theme'),g=localStorage.getItem('nl-design')||'delft',F="
              + json.dumps(DESIGN_FONTS) + ";if(t)d.setAttribute('data-theme',t);d.setAttribute('data-design',g);"
              "if(F[g])document.write('<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?'+F[g]+'&display=swap\">')}catch(e){}</script>")
I = {
 'gear': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 'sun': '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 'moon': '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
 'eye': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 'menu': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
 'check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
}

def md2html(path):
    return subprocess.run(['pandoc', '-f', 'gfm', '-t', 'html', '--wrap=none', path], capture_output=True, text=True, check=True).stdout

def first_line(path):
    return open(path, encoding='utf-8').readline().lstrip('# ').strip()

def split_title(t):
    m = re.match(r'^((?:A0|A1|A2|B1|B2|C1)\.\d+)\s+(.*?)(?:\s*\((.*)\))?$', t)
    return (m.group(1), m.group(2), m.group(3)) if m else (None, t, None)

def planned_units():
    units = {}
    for line in open(os.path.join(SRC, '00-Course-Blueprint.md'), encoding='utf-8'):
        m = re.match(r'\|\s*((A0|A1|A2|B1|B2|C1)\.\d+)\s*\|\s*([^|]+)\|', line)
        if m: units.setdefault(m.group(2), []).append((m.group(1), m.group(3).strip()))
    return units

def collect():
    built = {}
    for dp, _, fs in os.walk(SRC):
        for f in fs:
            m = re.match(r'((A0|A1|A2|B1|B2|C1)\.(\d+))', f)
            if not f.endswith('.md') or not m: continue
            code = f"{m.group(2)}.{int(m.group(3))}"
            rel = os.path.relpath(os.path.join(dp, f), SRC)[:-3].replace(os.sep, '/') + '.html'
            src = os.path.join(dp, f)
            hm = re.search(r'\(about (\d+) hours?\)', open(src, encoding='utf-8').read())
            built[code] = {'src': src, 'href': rel, 'title': first_line(src), 'hours': int(hm.group(1)) if hm else None}
    return built

def md_inline(t):
    t = html.escape(t.strip(), quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<![\w*])\*(?!\s)(.+?)\*(?!\w)', r'<i>\1</i>', t)
    return re.sub(r'`(.+?)`', r'\1', t)

def plain(t):
    return re.sub(r'[*`]', '', t).strip()

def deck_data(built, nav):
    """Flashcards: every Dutch|English vocabulary row and every Rule/Pattern/Key idea paragraph, in course order."""
    cards, seen = [], set()
    for code in [u['code'] for l in nav for u in l['units'] if u['href']]:
        lines = open(built[code]['src'], encoding='utf-8').read().split('\n'); section = ''
        for i, line in enumerate(lines):
            if line.startswith('#'): section = re.sub(r'^#+\s*(Part \d+:\s*)?', '', line).strip()
            if line.startswith('|') and i + 1 < len(lines) and re.match(r'^\|\s*:?-', lines[i + 1]):
                hs = [c.strip().lower() for c in line.strip().strip('|').split('|')]
                if 'dutch' not in hs or 'english' not in hs or 'who' in hs: continue
                di, ei, j = hs.index('dutch'), hs.index('english'), i + 2
                while j < len(lines) and lines[j].startswith('|'):
                    c = [x.strip() for x in lines[j].strip().strip('|').split('|')]; j += 1
                    if len(c) <= max(di, ei): continue
                    nl, en = plain(c[di]), plain(c[ei])
                    key = nl.lower()
                    if not nl or not en or key in seen or nl in ('—', '-') or nl.lower() == en.lower(): continue
                    seen.add(key); cards.append({'t': 'w', 'u': code, 'nl': nl, 'en': en})
            m = re.match(r'^\*\*((?:Rule|Pattern|Key idea)[^*]*?):?\*\*:?\s*(.+)$', line)
            if m and 'whole course' not in m.group(1):
                body = m.group(2).strip(); key = 'r:' + body[:80]
                if key in seen: continue
                seen.add(key); cards.append({'t': 'r', 'u': code, 'label': m.group(1).rstrip(':. ').strip(), 'sec': section, 'html': md_inline(body)})
    return cards

def nav_data(built):
    plan = planned_units(); levels = []
    for c, name, desc, hrs in LEVELS:
        us = []
        for code, theme in plan.get(c, []):
            b = built.get(code)
            us.append({'code': code, 'title': split_title(b['title'])[1] if b else theme, 'href': b['href'] if b else None, 'hours': b['hours'] if b else None})
        levels.append({'code': c, 'name': name, 'desc': desc, 'hours': hrs, 'exam': EXAMS[c], 'units': us})
    return levels

def shell_top(title, up, page_code, crumb):
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            f'<title>{html.escape(title)}</title>{THEME_INIT}{FONTS}<link rel="stylesheet" href="{up}assets/style.css"><link rel="stylesheet" href="{up}assets/designs.css"></head>'
            f'<body data-up="{up}" data-code="{page_code}">'
            f'<header class="bar"><button type="button" class="icon-btn only-icon menu-btn" aria-label="Open course menu" aria-controls="sidenav" aria-expanded="false">{I["menu"]}</button>'
            f'<a class="brand" href="{up}index.html"><span class="brand-mark">NL</span><span>Nederlands</span></a>'
            f'<span class="crumb">{crumb}</span><span class="bar-sp"></span>'
            f'<span class="bar-prog" title="Units completed"><span class="bar-prog-track"><i></i></span><span class="bar-prog-txt">0 / 0</span></span>'
            f'<a class="icon-btn set-btn{" on" if page_code == "settings" else ""}" href="{up}settings.html" aria-label="Settings" title="Settings">{I["gear"]}<span class="lbl">Settings</span></a></header>'
            f'<div class="shell"><nav class="sidenav" id="sidenav" aria-label="Course"></nav><div class="scrim" hidden></div><main class="main" id="main">')

def shell_bottom(up, nav):
    return (f'</main></div><script>window.COURSE={json.dumps(nav, ensure_ascii=False)};</script>'
            f'<script src="{up}assets/deck.js"></script><script src="{up}assets/cards.js"></script>'
            f'<script src="{up}assets/app.js"></script></body></html>')

def unit_page(code, info, nav, prev, nxt):
    rel = info['href']; up = '../' * rel.count('/')
    body = md2html(info['src'])
    body = re.sub(r'<h1[^>]*>.*?</h1>', '', body, count=1, flags=re.S)
    # notes for the course builders, not for learners
    body = re.sub(r'<h2[^>]*>\s*How this unit works in the app\s*</h2>.*?(?=<h2|$)', '', body, flags=re.S)
    _, en, nl = split_title(info['title'])
    lv = code.split('.')[0]; lvname = dict((c, n) for c, n, *_ in LEVELS)[lv]
    m = re.search(r'<h2[^>]*>.*?</h2>\s*<p>(.*?)</p>', body, re.S); lead = m.group(1) if m else ''
    if lead: body = body.replace('<p>' + lead + '</p>', '', 1)
    hrs = f'<span class="chip">About {info["hours"]} hours</span>' if info['hours'] else ''
    hero = (f'<section class="hero" data-lv="{lv}" data-code="{code}"><div class="chips"><span class="chip lv">Level {lv} · {html.escape(lvname)}</span><span class="chip">Unit {code}</span>{hrs}'
            f'<span class="chip done-chip" hidden>{I["check"]} Completed</span></div>'
            f'<h1>{html.escape(en)}</h1>' + (f'<p class="nl">{html.escape(nl)}</p>' if nl else '')
            + (f'<p class="lead">{lead}</p>' if lead else '')
            + '</section>')
    pager = '<nav class="pager">'
    if prev: pager += f'<a href="{up}{prev["href"]}"><small>Previous</small>{html.escape(prev["code"] + " " + prev["title"])}</a>'
    if nxt: pager += f'<a class="nx" href="{up}{nxt["href"]}"><small>Next</small>{html.escape(nxt["code"] + " " + nxt["title"])}</a>'
    pager += '</nav>'
    complete = (f'<section class="complete-box unit-check" id="unit-check"><div class="uc-head"><p class="eyebrow">Unit check</p><h3>Pass this unit</h3>'
                f'<p class="uc-intro">Answer a short set of questions from this unit. Score 80% or more to complete it and unlock the next unit.</p></div>'
                f'<button type="button" class="btn-primary uc-start">{I["check"]}<span>Start the unit check</span></button><div class="uc-body" hidden></div></section>')
    crumb = f'<a href="{up}index.html">Dashboard</a><span>/</span>Level {lv}<span>/</span>{code}'
    out = shell_top(info['title'], up, code, crumb) + hero + f'<article class="content">{body}{complete}{pager}</article>' + shell_bottom(up, nav)
    dest = os.path.join(SITE, rel); os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(out)

def plan_page(nav):
    body = md2html(os.path.join(SRC, '00-Course-Blueprint.md'))
    body = re.sub(r'<h1[^>]*>.*?</h1>', '', body, count=1, flags=re.S)
    hero = ('<section class="hero"><div class="chips"><span class="chip">Course plan</span></div><h1>Dutch Course Plan</h1>'
            '<p class="lead">How the course is built: six levels from A0 to C1, the units in each, the pronunciation track, and the exam projects that mirror the real certificates.</p>'
            f'<div class="hero-actions"><span class="updated">Updated {STAMP}</span></div></section>')
    out = shell_top('Dutch Course Plan', '', 'plan', '<a href="index.html">Dashboard</a><span>/</span>Course plan') + hero + f'<article class="content">{body}</article>' + shell_bottom('', nav)
    open(os.path.join(SITE, '00-Course-Blueprint.html'), 'w', encoding='utf-8').write(out)

def dashboard(nav):
    total = sum(len(l['units']) for l in nav); ready = sum(1 for l in nav for u in l['units'] if u['href'])
    body = f'''
<section class="dash-head">
  <div class="dash-hi"><p class="eyebrow">Your Dutch course</p><h1 class="greet">Welkom!</h1>
    <p class="lead">From your first sounds to reading research papers. Pick up where you left off, or open any unit from the menu.</p></div>
  <a class="continue" href="#" id="continue"><span class="eyebrow">Start here</span><span class="c-title">A0.1 How Dutch Works</span>
    <span class="c-meta">Level A0 · Foundations</span><span class="c-bar"><i style="width:0%"></i></span><span class="c-go">Start unit &rarr;</span></a>
</section>
<a class="fc-dash" id="fc-dash" href="flashcards.html" hidden><span class="fd-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 4h12a2 2 0 0 1 2 2v11"/></svg></span>
  <span class="fd-main"><span class="eyebrow">Flashcards</span><span class="fd-t"><b>0</b> cards to study now</span><span class="fd-sub"></span></span><span class="fd-go">Study &rarr;</span></a>
<section class="stats">
  <div class="stat"><span class="eyebrow">Units completed</span><b id="st-done">0</b><span id="st-done-sub">of {total} in the course</span></div>
  <div class="stat"><span class="eyebrow">Current level</span><b id="st-level">A0</b><span id="st-level-sub">Foundations</span></div>
  <div class="stat"><span class="eyebrow">Study time done</span><b id="st-hours">0 h</b><span>of about 1,170 hours to C1</span></div>
  <div class="stat"><span class="eyebrow">Units available</span><b>{ready}</b><span>more are added as they're written</span></div>
</section>
<section class="levels-sec"><div class="sec-h"><h2>Your path to C1</h2><a href="00-Course-Blueprint.html">Course plan &rarr;</a></div>
  <ol class="path" id="path"></ol></section>
<p class="updated dash-upd">Updated {STAMP}</p>'''
    out = shell_top('Nederlands Dashboard', '', 'home', 'Dashboard') + body + shell_bottom('', nav)
    open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8').write(out)

def cards_page(nav):
    body = ('<section class="hero fc-hero"><div class="chips"><span class="chip">Practice</span></div><h1>Flashcards</h1>'
            '<p class="lead">Words, pronunciation and rules from the units you have opened. Rate each card honestly: '
            'easy cards come back after days or weeks, hard ones come back soon.</p></section>'
            '<section class="fc" id="fc" aria-live="polite"></section>')
    out = shell_top('Flashcards', '', 'cards', '<a href="index.html">Dashboard</a><span>/</span>Flashcards') + body + shell_bottom('', nav)
    open(os.path.join(SITE, 'flashcards.html'), 'w', encoding='utf-8').write(out)

def settings_page(nav):
    def row(title, sub, ctrl):
        return f'<div class="set-row"><div class="set-lbl"><b>{title}</b><small>{sub}</small></div><div class="set-ctl">{ctrl}</div></div>'
    def seg(pref, opts):
        return f'<div class="seg" role="radiogroup" data-pref="{pref}">' + ''.join(f'<button type="button" role="radio" data-v="{v}">{t}</button>' for v, t in opts) + '</div>'
    def sw(pref, label):
        return f'<button type="button" class="switch" role="switch" data-pref="{pref}" aria-label="{label}"><i></i></button>'
    designs = [
        ('delft', 'Delft', 'Clean and professional, in Delft blue with Dutch orange. A menu on the side and tabs for each part.'),
        ('paper', 'Paper', 'An elegant book. Serif type on cream pages with oxblood ink, a contents list instead of tabs.'),
        ('arcade', 'Quest', 'A game meets an online course. A lesson path, a progress bar for every unit, chunky buttons and a tab bar at the bottom.'),
    ]
    dz = ''.join(
        f'<button type="button" class="design" role="radio" data-design="{k}" aria-checked="false">'
        f'<span class="dz dz-{k}" aria-hidden="true"><span class="dz-bar"><i></i><i></i></span><span class="dz-body"><span class="dz-aa">Aa</span>'
        f'<span class="dz-h">Huis en stad</span><span class="dz-l"></span><span class="dz-l s"></span><span class="dz-btn">Check</span></span><span class="dz-tab"><i></i><i></i><i></i><i></i></span></span>'
        f'<span class="dz-name">{n}<span class="dz-tick">{I["check"]}</span></span><span class="dz-desc">{d}</span></button>' for k, n, d in designs)
    fonts = '&'.join(DESIGN_FONTS.values())
    body = (f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">'
            '<section class="hero set-hero"><div class="chips"><span class="chip">Settings</span></div><h1>Settings</h1>'
            '<p class="lead">Make the course look and work the way you like. Changes are saved on this device straight away.</p></section>'
            '<div class="settings" id="settings">'
            '<section class="set-sec" id="set-look"><h2>Appearance</h2><p class="set-sub">Choose a design. Each one changes the whole app: colours, type, layout and how you move around.</p>'
            f'<div class="designs" role="radiogroup" aria-label="Design">{dz}</div>'
            + row('Colour mode', 'Auto follows your phone or computer.', seg('theme', [('auto', 'Auto'), ('light', 'Light'), ('dark', 'Dark')])) +
            '</section>'
            '<section class="set-sec"><h2>Sound and speech</h2>'
            + row('Sound effects', 'A chime for right answers, a buzzer for wrong ones.', sw('sfx', 'Sound effects'))
            + row('Talking speed', 'How fast the Dutch voice speaks.', seg('rate', [('0.6', 'Slow'), ('0.8', 'Normal'), ('1', 'Natural'), ('1.15', 'Fast')]))
            + row('English in dialogues', 'Show the English line under each Dutch line.', sw('tr', 'English in dialogues')) +
            '</section>'
            '<section class="set-sec"><h2>Flashcards</h2>'
            + row('New cards a day', 'How many new cards to add each day.', seg('fcnew', [('5', '5'), ('10', '10'), ('20', '20'), ('30', '30'), ('50', '50')]))
            + row('Play audio on cards', 'Say each word aloud when the card appears.', sw('fcauto', 'Play audio on cards')) +
            '</section>'
            '<section class="set-sec" id="set-updates"><h2>Updates</h2><div class="set-upd">'
            + row('Course version', f'Updated {STAMP}. On a computer, reload the page to get the newest lessons.', '') +
            '</div></section>'
            '<section class="set-sec"><h2>Your progress</h2><p class="set-sub">Your progress is saved on this device only. Make a backup code to move it to another phone or computer.</p>'
            + row('Back up', 'Copy a code that holds your progress and flashcards.', '<button type="button" class="btn-sec set-backup">Make a backup code</button>')
            + row('Restore', 'Paste a backup code from another device.', '<button type="button" class="btn-sec set-restore">Paste a code</button>')
            + '<div class="set-code" hidden><textarea rows="4" spellcheck="false" aria-label="Backup code"></textarea><div class="set-code-btns"><button type="button" class="btn-primary set-code-go"></button><span class="set-code-msg" aria-live="polite"></span></div></div>'
            + row('Start again', 'Erase all progress and flashcards on this device.', '<button type="button" class="btn-sec set-reset">Erase my progress</button>') +
            '</section>'
            '<section class="set-sec"><h2>About</h2><p class="set-sub">Langua Dutch: a complete Dutch course for English speakers, from your first sounds (A0) to C1 and the NT2 exams. '
            'Speech uses the free voice and speech recognition on your device.</p></section>'
            '</div>')
    out = shell_top('Settings', '', 'settings', '<a href="index.html">Dashboard</a><span>/</span>Settings') + body + shell_bottom('', nav)
    open(os.path.join(SITE, 'settings.html'), 'w', encoding='utf-8').write(out)

def main():
    os.makedirs(os.path.join(SITE, 'assets'), exist_ok=True)
    for f in ('style.css', 'designs.css', 'app.js', 'cards.js'): shutil.copy(os.path.join(BASE, 'assets', f), os.path.join(SITE, 'assets', f))
    shutil.copy(os.path.join(BASE, 'launcher', 'serve.ps1'), os.path.join(SITE, 'assets', 'serve.ps1'))
    shutil.copy(os.path.join(BASE, 'launcher', 'Start Dutch Course.bat'), os.path.join(SITE, 'Start Dutch Course.bat'))
    built = collect(); nav = nav_data(built)
    order = [u for l in nav for u in l['units'] if u['href']]
    for i, u in enumerate(order):
        unit_page(u['code'], built[u['code']], nav, order[i-1] if i else None, order[i+1] if i < len(order)-1 else None)
    plan_page(nav); dashboard(nav); cards_page(nav); settings_page(nav)
    deck = deck_data(built, nav)
    open(os.path.join(SITE, 'assets', 'deck.js'), 'w', encoding='utf-8').write('window.DECK=' + json.dumps(deck, ensure_ascii=False, separators=(',', ':')) + ';')
    print('flashcards:', sum(1 for c in deck if c['t'] == 'w'), 'words,', sum(1 for c in deck if c['t'] == 'r'), 'rules')
    print('built', len(order), 'units')

if __name__ == '__main__':
    main()
