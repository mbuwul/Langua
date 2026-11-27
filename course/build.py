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
THEME_INIT = "<script>try{var t=localStorage.getItem('nl-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>"
I = {
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
            f'<title>{html.escape(title)}</title>{THEME_INIT}{FONTS}<link rel="stylesheet" href="{up}assets/style.css"></head>'
            f'<body data-up="{up}" data-code="{page_code}">'
            f'<header class="bar"><button type="button" class="icon-btn only-icon menu-btn" aria-label="Open course menu" aria-controls="sidenav" aria-expanded="false">{I["menu"]}</button>'
            f'<a class="brand" href="{up}index.html"><span class="brand-mark">NL</span><span>Nederlands</span></a>'
            f'<span class="crumb">{crumb}</span><span class="bar-sp"></span>'
            f'<span class="bar-prog" title="Units completed"><span class="bar-prog-track"><i></i></span><span class="bar-prog-txt">0 / 0</span></span>'
            f'<button type="button" class="icon-btn theme-btn" aria-label="Switch light or dark mode">{I["sun"]}{I["moon"]}<span class="lbl">Dark mode</span></button></header>'
            f'<div class="shell"><nav class="sidenav" id="sidenav" aria-label="Course"></nav><div class="scrim" hidden></div><main class="main" id="main">')

def shell_bottom(up, nav):
    return (f'</main></div><script>window.COURSE={json.dumps(nav, ensure_ascii=False)};</script>'
            f'<script src="{up}assets/app.js"></script></body></html>')

def unit_page(code, info, nav, prev, nxt):
    rel = info['href']; up = '../' * rel.count('/')
    body = md2html(info['src'])
    body = re.sub(r'<h1[^>]*>.*?</h1>', '', body, count=1, flags=re.S)
    _, en, nl = split_title(info['title'])
    lv = code.split('.')[0]; lvname = dict((c, n) for c, n, *_ in LEVELS)[lv]
    m = re.search(r'<h2[^>]*>.*?</h2>\s*<p>(.*?)</p>', body, re.S); lead = m.group(1) if m else ''
    if lead: body = body.replace('<p>' + lead + '</p>', '', 1)
    hrs = f'<span class="chip">About {info["hours"]} hours</span>' if info['hours'] else ''
    hero = (f'<section class="hero" data-lv="{lv}" data-code="{code}"><div class="chips"><span class="chip lv">Level {lv} · {html.escape(lvname)}</span><span class="chip">Unit {code}</span>{hrs}'
            f'<span class="chip done-chip" hidden>{I["check"]} Completed</span></div>'
            f'<h1>{html.escape(en)}</h1>' + (f'<p class="nl">{html.escape(nl)}</p>' if nl else '')
            + (f'<p class="lead">{lead}</p>' if lead else '')
            + f'<div class="hero-actions"><button type="button" class="icon-btn all-ans" aria-pressed="false">{I["eye"]}<span class="lbl">Show all answers</span></button>'
            f'<span class="updated">Updated {STAMP}</span></div></section>')
    pager = '<nav class="pager">'
    if prev: pager += f'<a href="{up}{prev["href"]}"><small>Previous</small>{html.escape(prev["code"] + " " + prev["title"])}</a>'
    if nxt: pager += f'<a class="nx" href="{up}{nxt["href"]}"><small>Next</small>{html.escape(nxt["code"] + " " + nxt["title"])}</a>'
    pager += '</nav>'
    complete = (f'<section class="complete-box"><div><h3>Finished this unit?</h3><p>Mark it complete to tick it off in the menu and update your progress.</p></div>'
                f'<button type="button" class="btn-primary mark-done">{I["check"]}<span>Mark unit as complete</span></button></section>')
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

def main():
    os.makedirs(os.path.join(SITE, 'assets'), exist_ok=True)
    for f in ('style.css', 'app.js'): shutil.copy(os.path.join(BASE, 'assets', f), os.path.join(SITE, 'assets', f))
    shutil.copy(os.path.join(BASE, 'launcher', 'serve.ps1'), os.path.join(SITE, 'assets', 'serve.ps1'))
    shutil.copy(os.path.join(BASE, 'launcher', 'Start Dutch Course.bat'), os.path.join(SITE, 'Start Dutch Course.bat'))
    built = collect(); nav = nav_data(built)
    order = [u for l in nav for u in l['units'] if u['href']]
    for i, u in enumerate(order):
        unit_page(u['code'], built[u['code']], nav, order[i-1] if i else None, order[i+1] if i < len(order)-1 else None)
    plan_page(nav); dashboard(nav)
    print('built', len(order), 'units')

if __name__ == '__main__':
    main()
