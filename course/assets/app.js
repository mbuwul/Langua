(function(){
  var root=document.documentElement, body=document.body, UP=body.getAttribute('data-up')||'', CODE=body.getAttribute('data-code')||'';
  var COURSE=window.COURSE||[];
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  var P={done:{},parts:{},last:null};try{var raw=JSON.parse(store('nl-progress')||'null');if(raw)P={done:raw.done||{},parts:raw.parts||{},last:raw.last||null}}catch(e){}
  function save(){store('nl-progress',JSON.stringify(P))}
  var ICON={check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'};

  var units=[];COURSE.forEach(function(l){l.units.forEach(function(u){u.level=l.code;units.push(u)})});
  var avail=units.filter(function(u){return u.href});
  function doneCount(list){return list.filter(function(u){return P.done[u.code]}).length}
  function levelOf(code){return COURSE.filter(function(l){return l.code===code.split('.')[0]})[0]}

  /* ---------- Theme ---------- */
  function current(){var t=root.getAttribute('data-theme');if(t)return t;return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
  function label(){document.querySelectorAll('.theme-btn .lbl').forEach(function(l){l.textContent=current()==='dark'?'Light mode':'Dark mode'})}
  document.querySelectorAll('.theme-btn').forEach(function(b){b.addEventListener('click',function(){var n=current()==='dark'?'light':'dark';root.setAttribute('data-theme',n);store('nl-theme',n);label()})});
  label();

  /* ---------- Unit page: headings and parts ---------- */
  var content=document.querySelector('.content'),parts=[];
  if(content){
    content.querySelectorAll('table').forEach(function(t){var w=document.createElement('div');w.className='tw';t.parentNode.insertBefore(w,t);w.appendChild(t)});
    [].slice.call(content.querySelectorAll('h2')).forEach(function(h,i){
      var txt=h.textContent.trim(),m=txt.match(/^Part (\d+):\s*(.*)$/),name=m?m[2]:txt;
      if(m)h.innerHTML='<span class="pn">PART '+m[1]+'</span><span>'+esc(name)+'</span>';
      if(!h.id)h.id='s'+i;parts.push({id:h.id,name:name,num:m?m[1]:null,el:h});
    });
    /* Dialogues as chat bubbles, vocabulary as word cards, notes as callouts */
    var TR=store('nl-tr')!=='off';
    content.querySelectorAll('.tw > table').forEach(function(t){
      var hs=[].map.call(t.querySelectorAll('thead th'),function(th){return th.textContent.trim().toLowerCase()});
      var rows=[].slice.call(t.querySelectorAll('tbody tr')),w=t.parentNode;
      if(hs[0]==='who'&&hs[1]==='dutch'&&hs[2]==='english'){
        var who={},n=0,c=document.createElement('div');c.className='chat';c.setAttribute('data-tr',TR?'on':'off');
        var head='<div class="chat-head"><span class="chat-slot"></span><button type="button" class="chip-btn tr-btn" aria-pressed="'+TR+'">'+(TR?'Hide English':'Show English')+'</button></div>';
        var body='';rows.forEach(function(r){var nm=r.children[0].textContent.trim();if(!(nm in who))who[nm]=n++;var k=who[nm];
          body+='<div class="msg s'+(k%2)+' c'+(k%4)+'"><span class="av" aria-hidden="true">'+esc(nm.replace(/^(Meneer|Mevrouw)\s+/,'').charAt(0))+'</span><div class="bub"><span class="who">'+esc(nm)+'</span><p class="nl" data-say>'+r.children[1].innerHTML+'</p><p class="en">'+r.children[2].innerHTML+'</p></div></div>'});
        c.innerHTML=head+'<div class="chat-body">'+body+'</div>';w.parentNode.replaceChild(c,w);
      } else if(hs.length===2&&hs[0]==='dutch'&&hs[1]==='english'&&rows.length>=4){
        var g=document.createElement('div');g.className='words';
        g.innerHTML=rows.map(function(r){var d=r.children[0].innerHTML,txt=r.children[0].textContent.trim(),art=(txt.match(/^(de|het)\s/i)||[])[1];
          return '<div class="wcard'+(art?' a-'+art.toLowerCase():'')+'"><div class="w-nl"><span data-say>'+d+'</span></div><div class="w-en">'+r.children[1].innerHTML+'</div></div>'}).join('');
        w.parentNode.replaceChild(g,w);
      }
    });
    content.addEventListener('click',function(e){var b=e.target.closest('.tr-btn');if(!b)return;TR=b.getAttribute('aria-pressed')!=='true';store('nl-tr',TR?'on':'off');
      content.querySelectorAll('.chat').forEach(function(c){c.setAttribute('data-tr',TR?'on':'off');var x=c.querySelector('.tr-btn');x.setAttribute('aria-pressed',TR);x.textContent=TR?'Hide English':'Show English'})});
    content.querySelectorAll('p > strong:first-child').forEach(function(st){var m=st.textContent.match(/^(Note|Tip|Notice|Careful|Watch out|Two traps|One trap|Two things|Remember|Important|Rule|Pattern|Step|Key idea|Why)/i);
      if(m&&st.parentNode.parentNode===content||m&&st.parentNode.parentNode.classList&&st.parentNode.parentNode.classList.contains('panel'))st.parentNode.className='callout'+(/careful|watch|trap/i.test(m[1])?' warn':/rule|pattern|key idea/i.test(m[1])?' rule':'')});
  }
  var isUnit=/^(A0|A1|A2|B1|B2|C1)\.\d+$/.test(CODE);
  if(isUnit){P.last=CODE;var rec=P.parts[CODE]||{seen:{},total:0};rec.total=parts.length;P.parts[CODE]=rec;save()}

  /* ---------- Sidebar ---------- */
  var nav=document.getElementById('sidenav');
  function unitIcon(u){
    if(P.done[u.code])return '<span class="sn-ico done">'+ICON.check+'</span>';
    if(!u.href)return '<span class="sn-ico locked">'+ICON.lock+'</span>';
    if(u.code===CODE)return '<span class="sn-ico cur"></span>';
    var r=P.parts[u.code];if(r&&Object.keys(r.seen).length)return '<span class="sn-ico started"></span>';
    return '<span class="sn-ico"></span>';
  }
  function renderNav(){
    if(!nav)return;
    var openLv=isUnit?CODE.split('.')[0]:(nav.getAttribute('data-open')||null);
    if(!openLv){var nx=avail.filter(function(u){return !P.done[u.code]})[0]||avail[0];openLv=P.last?P.last.split('.')[0]:(nx?nx.level:'A0')}
    var total=units.length,dn=doneCount(units);
    var h='<div class="sn-inner"><div class="sn-top">'
      +'<a class="sn-link'+(CODE==='home'?' on':'')+'" href="'+UP+'index.html">'+ICON.home+'<span>Dashboard</span></a>'
      +'<a class="sn-link'+(CODE==='plan'?' on':'')+'" href="'+UP+'00-Course-Blueprint.html">'+ICON.map+'<span>Course plan</span></a></div>'
      +'<div class="sn-prog"><div class="sn-prog-row"><span>Course progress</span><b>'+Math.round(100*dn/Math.max(total,1))+'%</b></div><div class="track"><i style="width:'+(100*dn/Math.max(total,1))+'%"></i></div><small>'+dn+' of '+total+' units complete</small></div>'
      +'<p class="sn-label">Levels</p><div class="sn-levels">';
    COURSE.forEach(function(l){
      var d=doneCount(l.units),n=l.units.length,open=l.code===openLv,pct=n?d/n:0,full=d===n&&n>0;
      var C=2*Math.PI*9;
      h+='<section class="sn-level'+(open?' open':'')+(full?' full':'')+'" data-lv="'+l.code+'">'
        +'<button type="button" class="sn-lv-btn" aria-expanded="'+open+'"><span class="sn-badge">'+l.code+'</span>'
        +'<span class="sn-lv-name">'+esc(l.name)+'<small>'+d+' of '+n+' complete</small></span>'
        +'<svg class="ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="ring-bg"/><circle cx="12" cy="12" r="9" class="ring-fg'+(pct?'':' zero')+'" stroke-dasharray="'+(C*pct)+' '+C+'" transform="rotate(-90 12 12)"/></svg>'
        +'<span class="chev">'+ICON.chev+'</span></button><div class="sn-panel"><ul class="sn-units">';
      l.units.forEach(function(u){
        var cls='sn-unit'+(P.done[u.code]?' done':'')+(u.code===CODE?' current':'')+(!u.href?' locked':'');
        var inner=unitIcon(u)+'<span class="sn-ut"><span class="sn-uc">'+u.code+'</span><span class="sn-tt">'+esc(u.title)+'</span></span>'+(!u.href?'<span class="soon">Soon</span>':'');
        h+='<li>'+(u.href?'<a class="'+cls+'" href="'+UP+u.href+'"'+(u.code===CODE?' aria-current="page"':'')+'>'+inner+'</a>':'<span class="'+cls+'" aria-disabled="true">'+inner+'</span>');
        if(u.code===CODE&&parts.length){
          var seen=(P.parts[CODE]||{seen:{}}).seen;
          var sc=Object.keys((P.parts[CODE]||{seen:{}}).seen).length;h+='<div class="sn-uprog"><div class="track"><i style="width:'+(100*sc/parts.length)+'%"></i></div><span>'+sc+' of '+parts.length+' parts done</span></div>';
        }
        h+='</li>';
      });
      h+='</ul></div></section>';
    });
    h+='</div></div>';
    nav.innerHTML=h;nav.setAttribute('data-open',openLv);
    nav.querySelectorAll('.sn-lv-btn').forEach(function(b){b.addEventListener('click',function(){
      var sec=b.parentNode,willOpen=!sec.classList.contains('open');
      nav.querySelectorAll('.sn-level').forEach(function(s){s.classList.remove('open');s.querySelector('.sn-lv-btn').setAttribute('aria-expanded','false')});
      if(willOpen){sec.classList.add('open');b.setAttribute('aria-expanded','true');nav.setAttribute('data-open',sec.getAttribute('data-lv'))}
    })});
    nav.querySelectorAll('.sn-parts a').forEach(function(a){a.addEventListener('click',closeMenu)});
    var cur=nav.querySelector('.sn-unit.current');if(cur&&cur.scrollIntoView&&nav.scrollHeight>nav.clientHeight){var r=cur.getBoundingClientRect();if(r.top>window.innerHeight*.7)nav.scrollTop+=r.top-200}
    // top bar
    document.querySelectorAll('.bar-prog-txt').forEach(function(t){t.textContent=dn+' / '+total+' units'});
    document.querySelectorAll('.bar-prog-track i').forEach(function(i){i.style.width=(100*dn/Math.max(total,1))+'%'});
    var chip=document.querySelector('.done-chip');if(chip)chip.hidden=!P.done[CODE];
    var mb=document.querySelector('.mark-done');if(mb){var on=!!P.done[CODE];mb.classList.toggle('is-done',on);mb.querySelector('span').textContent=on?'Completed (click to undo)':'Mark unit as complete'}
  }
  renderNav();

  /* Mobile drawer */
  var menuBtn=document.querySelector('.menu-btn'),scrim=document.querySelector('.scrim');
  function closeMenu(){body.classList.remove('menu-open');if(scrim)scrim.hidden=true;if(menuBtn)menuBtn.setAttribute('aria-expanded','false')}
  if(menuBtn)menuBtn.addEventListener('click',function(){var o=!body.classList.contains('menu-open');body.classList.toggle('menu-open',o);scrim.hidden=!o;menuBtn.setAttribute('aria-expanded',o)});
  if(scrim)scrim.addEventListener('click',closeMenu);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});

  /* Lesson tabs: one part at a time */
  var panels=[],tabs=null,curIdx=0;
  if(isUnit&&parts.length){
    var kids=[].slice.call(content.childNodes),pi=-1,tail=[];
    parts.forEach(function(p,i){var d=document.createElement('section');d.className='panel';d.id='panel-'+p.id;d.setAttribute('role','tabpanel');panels.push(d)});
    kids.forEach(function(n){
      if(n.nodeType===1&&(n.classList.contains('complete-box')||n.classList.contains('pager'))){tail.push(n);return}
      if(n.nodeType===1&&n.tagName==='H2')pi=parts.map(function(p){return p.el}).indexOf(n);
      panels[Math.max(pi,0)].appendChild(n);
    });
    panels.forEach(function(d,i){
      var f=document.createElement('div');f.className='pnav';
      var prev=i>0?'<button type="button" class="btn-sec pprev" data-go="'+(i-1)+'">&larr; '+esc(parts[i-1].name)+'</button>':'<span></span>';
      var nxt=i<panels.length-1?'<button type="button" class="btn-primary pnext" data-go="'+(i+1)+'"><span>Next: '+esc(parts[i+1].name)+'</span> &rarr;</button>':'';
      f.innerHTML='<span class="pnav-step">Part '+(i+1)+' of '+panels.length+'</span><div class="pnav-btns">'+prev+nxt+'</div>';
      d.appendChild(f);content.appendChild(d);
    });
    var lastP=panels[panels.length-1];tail.forEach(function(n){lastP.insertBefore(n,lastP.lastChild)});
    tabs=document.createElement('div');tabs.className='ptabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Parts of this unit');
    tabs.innerHTML='<div class="ptabs-in">'+parts.map(function(p,i){return '<button type="button" role="tab" class="ptab" data-i="'+i+'" aria-controls="panel-'+p.id+'"><span class="pt-ico">'+ICON.check+'</span><span class="ptab-n">'+(i+1)+'</span><span class="ptab-t">'+esc(p.name)+'</span></button>'}).join('')+'</div>';
    content.parentNode.insertBefore(tabs,content);
    function paint(){var rec=P.parts[CODE];
      tabs.querySelectorAll('.ptab').forEach(function(t,i){var on=i===curIdx;t.classList.toggle('on',on);t.setAttribute('aria-selected',on);t.classList.toggle('seen',!!rec.seen[parts[i].id])});
      var sc=Object.keys(rec.seen).length,up=nav.querySelector('.sn-uprog');if(up){up.querySelector('i').style.width=(100*sc/parts.length)+'%';up.querySelector('span').textContent=sc+' of '+parts.length+' parts done'}
      var u=nav.querySelector('.sn-unit.current .sn-ico');if(u&&!P.done[CODE]&&Object.keys(rec.seen).length)u.className='sn-ico cur';
    }
    function show(i,scroll){curIdx=Math.max(0,Math.min(i,panels.length-1));
      panels.forEach(function(d,k){d.hidden=k!==curIdx});
      var rec=P.parts[CODE];rec.tab=curIdx;save();
      if(scroll){try{history.replaceState(null,'','#p-'+parts[curIdx].id)}catch(e){}}
      paint();var t=tabs.querySelector('.ptab.on');if(t&&t.scrollIntoView)tabs.querySelector('.ptabs-in').scrollLeft=t.offsetLeft-40;
      if(scroll){var y=document.querySelector('.hero').getBoundingClientRect().bottom+window.scrollY-60;window.scrollTo(0,Math.max(0,y))}
    }
    function seen(i){var rec=P.parts[CODE];if(!rec.seen[parts[i].id]){rec.seen[parts[i].id]=1;save();renderNav();paint()}}
    tabs.addEventListener('click',function(e){var b=e.target.closest('.ptab');if(b)show(+b.getAttribute('data-i'),true)});
    content.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(!b)return;var g=+b.getAttribute('data-go');if(g>curIdx)seen(curIdx);show(g,true)});
    window.addEventListener('hashchange',function(){var i=parts.map(function(p){return p.id}).indexOf(location.hash.slice(1).replace(/^p-/,''));if(i>=0&&i!==curIdx)show(i,true)});
    window.addEventListener('scroll',function(){if(window.innerHeight+window.scrollY>=document.body.scrollHeight-40)seen(curIdx)},{passive:true});
    var h0=parts.map(function(p){return p.id}).indexOf(location.hash.slice(1).replace(/^p-/,'')),rec0=P.parts[CODE];
    show(h0>=0?h0:(rec0.tab||0),false);
  }

  /* Mark complete */
  var mark=document.querySelector('.mark-done');
  if(mark)mark.addEventListener('click',function(){if(P.done[CODE])delete P.done[CODE];else P.done[CODE]=Date.now();save();renderNav();
    if(P.done[CODE]){var rec=P.parts[CODE];parts.forEach(function(p){rec.seen[p.id]=1});save();renderNav()}if(tabs)show(curIdx,false)});

  /* ---------- Dashboard ---------- */
  if(CODE==='home'){
    var next=null;
    if(P.last&&!P.done[P.last])next=avail.filter(function(u){return u.code===P.last})[0];
    if(!next)next=avail.filter(function(u){return !P.done[u.code]})[0];
    var cont=document.getElementById('continue');
    if(cont&&next){var lv=levelOf(next.code),rec=P.parts[next.code],pc=rec&&rec.total?Math.round(100*Object.keys(rec.seen).length/rec.total):0;
      cont.href=next.href;cont.querySelector('.eyebrow').textContent=pc?'Continue where you left off':'Up next';
      cont.querySelector('.c-title').textContent=next.code+' '+next.title;cont.querySelector('.c-meta').textContent='Level '+lv.code+' · '+lv.name+(next.hours?' · about '+next.hours+' hours':'');
      cont.querySelector('.c-bar i').style.width=pc+'%';cont.querySelector('.c-go').textContent=(pc?'Continue ('+pc+'% read)':'Start unit')+' →'}
    else if(cont){cont.querySelector('.eyebrow').textContent='All available units done';cont.querySelector('.c-title').textContent='Great work! New units are on the way.';cont.removeAttribute('href')}
    var dn=doneCount(units);document.getElementById('st-done').textContent=dn;
    var curLv=COURSE.filter(function(l){return doneCount(l.units)<l.units.length})[0]||COURSE[COURSE.length-1];
    document.getElementById('st-level').textContent=curLv.code;document.getElementById('st-level-sub').textContent=curLv.name;
    var hrs=0;units.forEach(function(u){if(P.done[u.code])hrs+=u.hours||Math.round(levelOf(u.code).hours/levelOf(u.code).units.length)});
    document.getElementById('st-hours').textContent=hrs+' h';
    var path=document.getElementById('path'),ph='';
    COURSE.forEach(function(l){
      var d=doneCount(l.units),n=l.units.length,a=l.units.filter(function(u){return u.href}).length,first=l.units.filter(function(u){return u.href&&!P.done[u.code]})[0]||l.units.filter(function(u){return u.href})[0];
      var st=d===n?'Completed':(d>0||l.units.some(function(u){return P.parts[u.code]}))?'In progress':a?'Ready to start':'Coming soon';
      var stc=d===n?'ok':st==='In progress'?'go':a?'ready':'soon';
      ph+='<li class="lvl lv-'+l.code+'"><div class="lvl-badge">'+l.code+'</div><div class="lvl-main"><div class="lvl-top"><h3>'+esc(l.name)+'</h3><span class="pill '+stc+'">'+st+'</span></div>'
        +'<p>'+esc(l.desc)+'</p><p class="lvl-exam"><span>Exam project</span>'+esc(l.exam)+'</p>'
        +'<div class="lvl-bar"><div class="track"><i style="width:'+(100*d/n)+'%"></i></div><span>'+d+' / '+n+' units done · '+a+' available</span></div></div>'
        +'<div class="lvl-cta">'+(first?'<a class="btn-sec" href="'+first.href+'">'+(d?'Continue':'Open')+' '+first.code+'</a>':'<span class="btn-sec disabled">Coming soon</span>')+'</div></li>';
    });
    path.innerHTML=ph;
  }

  if(!content)return;

  /* ---------- Hidden answers ---------- */
  var all=[];
  function makeReveal(node){
    var wrap=document.createElement('span');wrap.className='ans';
    var btn=document.createElement('button');btn.type='button';btn.className='ans-btn';btn.textContent='Show answer';
    var val=document.createElement('span');val.className='ans-val';val.hidden=true;val.appendChild(node);
    btn.addEventListener('click',function(){var o=val.hidden;val.hidden=!o;btn.textContent=o?'Hide':'Show answer'});
    wrap.appendChild(btn);wrap.appendChild(val);all.push([btn,val]);return wrap;
  }
  content.querySelectorAll('strong').forEach(function(s){
    if(!/^Answer:/.test(s.textContent)||s.closest('.ans'))return;
    var frag=document.createDocumentFragment(),n=s.nextSibling,parent=s.parentNode;
    frag.appendChild(s.cloneNode(true));while(n){var nx=n.nextSibling;frag.appendChild(n);n=nx}
    parent.replaceChild(makeReveal(frag),s);parent.setAttribute('data-done','1');
  });
  content.querySelectorAll('ol > li').forEach(function(li){
    if(li.closest('blockquote')||li.closest('.sn-parts'))return;
    var host=li.querySelector('p')||li;if(host.getAttribute('data-done')||li.querySelector('.ans'))return;
    var last=host.lastChild;while(last&&last.nodeType===3&&!last.textContent.trim())last=last.previousSibling;
    if(!last||last.nodeType!==3)return;
    var t=last.textContent,m=t.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/);if(!m)return;
    last.textContent=t.slice(0,m.index);host.appendChild(makeReveal(document.createTextNode(m[1])));
  });
  /* ---------- Practice: type-in answers, word tiles, microphone check ---------- */
  (function(){
    function norm(s){return String(s).toLowerCase().replace(/[’‘`´]/g,"'").replace(/[.,!?;:"“”()]/g,' ').replace(/\s+/g,' ').trim()}
    function okAns(given,ans){var g=norm(given);return ans.split('|').some(function(a){return norm(a)===g&&g!==''})}
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    var mic='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
    var groups=[],sayItems=[];
    /* Microphone: ask once per page, then reuse the same stream for every "Say it" button. */
    var isFile=location.protocol==='file:',micStream=null,micAsk=null,take=null;
    function getMic(){
      if(window.Capacitor)return Promise.resolve(null); /* Android app: native speech shim handles permission */
      if(micStream&&micStream.getAudioTracks().some(function(t){return t.readyState==='live'}))return Promise.resolve(micStream);
      if(micAsk)return micAsk;
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return Promise.reject({name:isFile?'NotAllowedError':'NoMedia'});
      micAsk=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}).then(function(st){micStream=st;micAsk=null;return st},function(e){micAsk=null;throw e});
      return micAsk}
    function freeMic(){if(micStream){micStream.getTracks().forEach(function(t){t.stop()});micStream=null}}
    window.addEventListener('pagehide',freeMic);
    var START='<b>Start Dutch Course</b>';
    function micHelp(name,fromSR){
      if(name==='NotAllowedError'||name==='SecurityError'||name==='not-allowed'||name==='service-not-allowed'){
        if(isFile)return 'Your browser blocks the microphone on pages opened straight from a folder, so it keeps asking. Close this tab and open the course by double-clicking '+START+' in your course folder. After that it asks only once.';
        return fromSR?'The browser blocked the speech check. Click the icon at the left of the address bar, set Microphone to Allow, then reload the page.':'The microphone is blocked for this site. Click the icon at the left of the address bar, set Microphone to Allow, then reload the page.'}
      if(name==='NotFoundError'||name==='OverconstrainedError')return 'No microphone found. Plug in a headset or check the microphone in your computer’s sound settings.';
      if(name==='NotReadableError'||name==='AbortError')return 'Another program is using the microphone (for example Teams or Zoom). Close it and try again.';
      if(name==='NoMedia')return 'This browser cannot use the microphone. Please use Chrome or Edge.';
      return 'Microphone problem'+(name?' ('+esc(name)+')':'')+'. Try again.'}
    function stopTake(){if(!take)return;var t=take;take=null;clearTimeout(t.timer);
      try{t.r&&t.r.stop()}catch(e){}try{t.rec&&t.rec.state!=='inactive'&&t.rec.stop()}catch(e){}t.done()}
    function startTake(stream,li,target,b,fb,out){
      var lbl=b.querySelector('span'),me={},ended=false,chunks=[],gotResult=false;take=me;
      b.classList.add('listening');lbl.textContent=SR?'Listening… (click to stop)':'Recording… (click to stop)';
      fb.textContent=SR?'Speak now.':'Recording. Say the sentence, then click Stop. (This browser has no speech check, so compare your voice with the model.)';
      me.done=function(){if(ended)return;ended=true;if(take===me)take=null;b.classList.remove('listening');lbl.textContent='Say it again';
        if(!gotResult)fb.textContent=SR?'Stopped. Click Say it again to try.':'Now play yourself back and compare with the model.'};
      /* Record a copy so the learner can hear themselves. */
      if(stream&&window.MediaRecorder){try{me.rec=new MediaRecorder(stream);me.rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
        me.rec.onstop=function(){if(!chunks.length)return;var blob=new Blob(chunks,{type:chunks[0].type||'audio/webm'});
          var pl=li.querySelector('.ex-me');if(!pl){pl=document.createElement('div');pl.className='ex-me';b.parentNode.parentNode.insertBefore(pl,b.parentNode.nextSibling)}
          var old=pl.getAttribute('data-url');if(old)URL.revokeObjectURL(old);var url=URL.createObjectURL(blob);pl.setAttribute('data-url',url);
          pl.innerHTML='<button type="button" class="btn-sec me-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg><span>Hear yourself</span></button><span class="me-tip">then press the speaker next to the sentence to hear the model</span>';
          pl.querySelector('.me-btn').addEventListener('click',function(){try{speechSynthesis.cancel()}catch(e){}new Audio(url).play()})};
        me.rec.start()}catch(e){me.rec=null}}
      if(SR){var r=new SR();me.r=r;r.lang='nl-NL';r.interimResults=false;r.maxAlternatives=5;r.continuous=false;
        r.onresult=function(e){gotResult=true;var tw=norm(target).split(' '),best=null;
          for(var i=0;i<e.results[0].length;i++){var heard=e.results[0][i].transcript,hw=norm(heard).split(' '),pool=hw.slice(),hit=tw.map(function(w){var k=pool.indexOf(w);if(k>=0){pool.splice(k,1);return true}return false});
            var sc=hit.filter(Boolean).length/tw.length;if(!best||sc>best.sc)best={sc:sc,heard:heard,hit:hit}}
          var pct=Math.round(100*best.sc),words=target.split(/\s+/);
          out.hidden=false;out.innerHTML='<span class="eyebrow">Heard</span> “'+esc(best.heard)+'”<br><span class="eyebrow">Your words</span> '+words.map(function(w,i){return '<span class="'+(best.hit[i]?'w-ok':'w-miss')+'">'+esc(w)+'</span>'}).join(' ');
          mark(li,pct>=80,pct>=100?'Perfect: 100%':pct>=80?'Good: '+pct+'%':'Score '+pct+'%. Listen again and repeat the red words.')};
        r.onerror=function(e){gotResult=true;var m=e.error;
          fb.innerHTML=m==='no-speech'?'I heard nothing. Click and speak a little louder, close to the microphone.':m==='aborted'?'Stopped.':m==='network'?'The speech check needs an internet connection (Chrome and Edge use their free online speech service). You can still hear yourself below.':m==='language-not-supported'?'This browser has no Dutch speech check. Use Chrome or Edge, or hear yourself below and compare.':m==='audio-capture'?micHelp('NotReadableError'):micHelp(m,true)};
        r.onend=function(){if(take===me){try{me.rec&&me.rec.state!=='inactive'&&me.rec.stop()}catch(e){}me.done()}};
        try{r.start()}catch(err){fb.textContent='Click again to start the microphone.';stopTake()}
        me.timer=setTimeout(stopTake,15000)}
      else me.timer=setTimeout(stopTake,8000)}
    function score(list){if(!list)return;var items=list.querySelectorAll('li.ex'),ok=list.querySelectorAll('li.ex.ex-ok').length,s=list.nextElementSibling;
      if(!s||!s.classList.contains('ex-score')){s=document.createElement('div');s.className='ex-score';list.parentNode.insertBefore(s,list.nextSibling)}
      s.innerHTML='<span class="track"><i style="width:'+(100*ok/items.length)+'%"></i></span><span><b>'+ok+'</b> of '+items.length+' correct</span>'+(ok===items.length?'<span class="ex-all">Well done!</span>':'')}
    function mark(li,good,msg){li.classList.toggle('ex-ok',good);li.classList.toggle('ex-no',!good);var f=li.querySelector('.ex-fb');if(f)f.textContent=msg||(good?'Correct':'Not quite. Try again.');score(li.parentNode)}
    content.querySelectorAll('li').forEach(function(li){
      var host=li.querySelector(':scope > p')||li,h=host.innerHTML,m=h.match(/\[\[([^\]]+)\]\]\s*$/);if(!m)return;
      var ans=m[1].replace(/&amp;/g,'&').trim();h=h.slice(0,m.index);li.classList.add('ex');host.setAttribute('data-done','1');
      if(/^say$/i.test(ans)){
        li.classList.add('ex-say');host.innerHTML=h;
        var tgtEl=host.querySelector('strong')||host,target=tgtEl.textContent.trim();tgtEl.setAttribute('data-say','');
        var row=document.createElement('div');row.className='ex-row';
        row.innerHTML='<button type="button" class="btn-sec mic-btn">'+mic+'<span>Say it</span></button><span class="ex-fb" aria-live="polite"></span>';
        host.appendChild(row);var out=document.createElement('div');out.className='ex-heard';out.hidden=true;host.appendChild(out);
        var mb=row.querySelector('.mic-btn'),fb=row.querySelector('.ex-fb');
        mb.addEventListener('click',function(){
          if(mb.classList.contains('listening')){stopTake();return}
          stopTake();try{speechSynthesis.cancel()}catch(e){}
          fb.textContent='Getting the microphone ready…';
          getMic().then(function(stream){startTake(stream,li,target,mb,fb,out)},function(err){fb.innerHTML=micHelp(err&&err.name)});
        });
        sayItems.push(li);
        return;
        return;
      }
      var shown=ans.split('|')[0],tm=h.match(/\{\{([^}]+)\}\}/),ctl;
      if(tm){
        host.innerHTML=h.slice(0,tm.index)+'<span class="tl-slot"></span>'+h.slice(tm.index+tm[0].length);
        var tiles=tm[1].split(' / ').map(function(t){return t.trim()}).filter(Boolean),order=tiles.slice();
        for(var k=0;k<8&&order.join(' ')===tiles.join(' ')&&tiles.length>1;k++)order.sort(function(){return Math.random()-.5});
        var box=document.createElement('div');box.className='tl';box.innerHTML='<div class="tl-line" aria-label="Your sentence"><span class="tl-ph">Tap the words in the right order</span></div><div class="tl-bank">'+order.map(function(t){return '<button type="button" class="tile">'+t+'</button>'}).join('')+'</div>';
        host.querySelector('.tl-slot').replaceWith(box);
        var line=box.querySelector('.tl-line'),bank=box.querySelector('.tl-bank');
        box.addEventListener('click',function(e){var t=e.target.closest('.tile');if(!t)return;(t.parentNode===bank?line:bank).appendChild(t);
          line.querySelector('.tl-ph').hidden=!!line.querySelector('.tile');li.classList.remove('ex-ok','ex-no');var f=li.querySelector('.ex-fb');if(f)f.textContent=''});
        ctl=function(){return [].map.call(line.querySelectorAll('.tile'),function(t){return t.textContent}).join(' ')};
      } else {
        var w=Math.max(4,Math.min(28,shown.length+2));
        var inp='<input type="text" class="ex-in" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:'+w+'ch" aria-label="Your answer">';
        host.innerHTML=/_{3,}/.test(h)?h.replace(/_{3,}/,inp):h+' '+inp;
        var input=host.querySelector('.ex-in');ctl=function(){return input.value};
        input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();check()}});
        input.addEventListener('input',function(){li.classList.remove('ex-ok','ex-no')});
      }
      var row=document.createElement('div');row.className='ex-row';row.innerHTML='<button type="button" class="ex-check">Check</button><span class="ex-fb" aria-live="polite"></span>';
      host.appendChild(row);row.appendChild(makeReveal(document.createTextNode(shown)));
      function check(){mark(li,okAns(ctl(),ans))}
      row.querySelector('.ex-check').addEventListener('click',check);
      groups.indexOf(li.parentNode)<0&&groups.push(li.parentNode);
    });
    groups.forEach(score);
    if(isFile&&sayItems.length){var n=document.createElement('p');n.className='callout warn mic-note';
      n.innerHTML='<strong>Microphone:</strong> you opened this page straight from a folder, so the browser will keep asking for the microphone and the speaking checks will not work. Close the browser and double-click '+START+' in your course folder instead. The course then runs at <b>localhost</b> and the microphone works after you allow it once.';
      var l0=sayItems[0].parentNode;l0.parentNode.insertBefore(n,l0)}
    content.querySelectorAll('li.ex-say').forEach(function(li){if(groups.indexOf(li.parentNode)<0){groups.push(li.parentNode);score(li.parentNode)}});
  })();

  var allBtn=document.querySelector('.all-ans');
  if(allBtn){if(!all.length){allBtn.hidden=true}else{allBtn.addEventListener('click',function(){
    var show=allBtn.getAttribute('aria-pressed')!=='true';allBtn.setAttribute('aria-pressed',show);
    allBtn.querySelector('.lbl').textContent=show?'Hide all answers':'Show all answers';
    all.forEach(function(p){p[1].hidden=!show;p[0].textContent=show?'Hide':'Show answer'})})}}

  /* ---------- Self-check lists ---------- */
  var key='nl-tasks:'+CODE,saved={};try{saved=JSON.parse(store(key)||'{}')}catch(e){}
  content.querySelectorAll('.task-list input').forEach(function(c,i){c.disabled=false;c.checked=!!saved[i];
    c.addEventListener('change',function(){saved[i]=c.checked;store(key,JSON.stringify(saved))})});

  /* ---------- Listen buttons (browser's Dutch voice, free) + speed ---------- */
  if('speechSynthesis' in window){
    var voices=[];function pick(){var v=speechSynthesis.getVoices();voices=v.filter(function(x){return /^nl(-|_)NL/i.test(x.lang)});if(!voices.length)voices=v.filter(function(x){return /^nl/i.test(x.lang)})}
    pick();speechSynthesis.onvoiceschanged=pick;
    var sp='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    function clean(t){return t.replace(/\([^)]*\)/g,' ').replace(/\.\.\.|…|___/g,' ').replace(/[\/→=+]/g,', ').replace(/["“”]/g,'').replace(/\s+/g,' ').trim()}
    function say(list,btn){speechSynthesis.cancel();document.querySelectorAll('.speaking').forEach(function(b){b.classList.remove('speaking')});
      if(btn)btn.classList.add('speaking');
      list.forEach(function(item,i){var t=typeof item==='string'?item:item.t;if(!t)return;var u=new SpeechSynthesisUtterance(t);u.lang='nl-NL';u.rate=RATE;
        var vi=typeof item==='object'&&item.v?item.v:0;if(voices.length)u.voice=voices[vi%voices.length];
        if(i===list.length-1)u.onend=u.onerror=function(){if(btn)btn.classList.remove('speaking')};speechSynthesis.speak(u)})}
    /* speed control in the top bar */
    var RATES=[[0.6,'Slow'],[0.8,'Normal'],[1,'Natural'],[1.15,'Fast']],RATE=parseFloat(store('nl-rate'))||0.8;
    var gauge='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18a9 9 0 1 1 16 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1.3" fill="currentColor"/></svg>';
    var th=document.querySelector('.theme-btn');
    if(th){var sb=document.createElement('button');sb.type='button';sb.className='icon-btn speed-btn';sb.title='Talking speed (click to change)';
      function rl(){var r=RATES.filter(function(x){return x[0]===RATE})[0]||RATES[1];sb.innerHTML=gauge+'<span class="lbl">Speed: </span><b>'+r[1]+'</b><span class="sx">'+r[0]+'×</span>';sb.setAttribute('aria-label','Talking speed: '+r[1]+'. Click to change.')}
      rl();sb.addEventListener('click',function(){var i=RATES.map(function(x){return x[0]}).indexOf(RATE);RATE=RATES[(i+1)%RATES.length][0];store('nl-rate',String(RATE));rl();say([RATE<0.7?'Langzaam':RATE<0.9?'Normaal':RATE<1.1?'Natuurlijk':'Snel'])});
      th.parentNode.insertBefore(sb,th)}
    function mk(label,cls){var b=document.createElement('button');b.type='button';b.className=cls||'speak';b.title=label;b.setAttribute('aria-label',label);b.innerHTML=sp;return b}
    var cols=/^(dutch|dutch spelling|short( \(.*\))?|long( \(.*\))?|singular|plural.*|statement|question|examples?|sign|right|ui|ij \/ ei|ou \/ au|words?( \d)?|sentence|sound( \d)?|letter|written|number|spelling|ik form|infinitive|stem.*|hij form|base|\+ en|near.*|far.*|possessive)$/i;
    if(content){
      content.querySelectorAll('table').forEach(function(t){
        var hs=[].map.call(t.querySelectorAll('thead th'),function(th){return th.textContent.trim()});
        var exI=hs.map(function(h){return /^examples?$/i.test(h)}).indexOf(true);
        hs.forEach(function(hd,ci){if(!cols.test(hd))return;var spell=/spelling|^sound$/i.test(hd)&&exI>=0;
          t.querySelectorAll('tbody tr').forEach(function(tr){var td=tr.children[ci];if(!td)return;var raw=td.textContent.trim();if(!raw||/^\(none\)$|^—$|^\?$/.test(raw))return;
            var b=mk('Listen: '+raw);
            b.addEventListener('click',function(){var list=[clean(td.textContent)];
              if(spell&&tr.children[exI]){var ex=clean(tr.children[exI].textContent).split(',')[0];if(ex)list.push(ex)}
              say(list,b)});
            td.insertBefore(b,td.firstChild)})});
        /* whole dialogue (tables that stayed tables) */
        if(/^who$/i.test(hs[0])){var di=hs.map(function(h){return /^dutch$/i.test(h)}).indexOf(true);if(di<0)return;
          var who={},n=0,rows=[].slice.call(t.querySelectorAll('tbody tr'));
          var pb=document.createElement('button');pb.type='button';pb.className='btn-sec play-all';pb.innerHTML=sp+'<span>Play the whole dialogue</span>';
          pb.addEventListener('click',function(){say(rows.map(function(r){var w=r.children[0].textContent.trim();if(!(w in who))who[w]=n++;return {t:clean(r.children[di].textContent),v:who[w]}}),pb)});
          var w=t.closest('.tw')||t;w.parentNode.insertBefore(pb,w)}
      });
      content.querySelectorAll('[data-say]').forEach(function(el){var b=mk('Listen: '+el.textContent.trim());b.addEventListener('click',function(){say([clean(el.textContent)],b)});el.parentNode.insertBefore(b,el)});
      content.querySelectorAll('.chat').forEach(function(c){var pb=document.createElement('button');pb.type='button';pb.className='btn-sec play-all';pb.innerHTML=sp+'<span>Play the whole dialogue</span>';
        var who={},n=0;pb.addEventListener('click',function(){say([].map.call(c.querySelectorAll('.msg'),function(m){var w=m.querySelector('.who').textContent;if(!(w in who))who[w]=n++;return {t:clean(m.querySelector('.nl').textContent),v:who[w]}}),pb)});
        c.querySelector('.chat-slot').appendChild(pb)});
      content.querySelectorAll('blockquote').forEach(function(q){
        var b=document.createElement('button');b.type='button';b.className='btn-sec play-all in-q';b.innerHTML=sp+'<span>Listen to this text</span>';
        b.addEventListener('click',function(){var ps=[].map.call(q.querySelectorAll('p'),function(p){return clean(p.textContent.replace(/^\s*\d+\.\s*/,''))}).filter(Boolean);say(ps,b)});
        q.insertBefore(b,q.firstChild)});
    }
  }
})();
