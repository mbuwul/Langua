(function(){
  var root=document.documentElement, body=document.body, UP=body.getAttribute('data-up')||'', CODE=body.getAttribute('data-code')||'';
  var COURSE=window.COURSE||[];
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  var P={done:{},parts:{},last:null,score:{}};try{var raw=JSON.parse(store('nl-progress')||'null');if(raw)P={done:raw.done||{},parts:raw.parts||{},last:raw.last||null,score:raw.score||{}}}catch(e){}
  function save(){store('nl-progress',JSON.stringify(P))}
  var ICON={check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
    cards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 4h12a2 2 0 0 1 2 2v11"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'};

  var units=[];COURSE.forEach(function(l){l.units.forEach(function(u){u.level=l.code;units.push(u)})});
  var avail=units.filter(function(u){return u.href});
  function doneCount(list){return list.filter(function(u){return P.done[u.code]}).length}
  /* Units open one after another: a unit unlocks when the one before it has been passed. */
  function unlocked(code){var i=avail.map(function(u){return u.code}).indexOf(code);return i<=0||!!P.done[code]||!!P.done[avail[i-1].code]}
  function nextUp(){return avail.filter(function(u){return !P.done[u.code]&&unlocked(u.code)})[0]||null}
  function levelOf(code){return COURSE.filter(function(l){return l.code===code.split('.')[0]})[0]}

  /* ---------- Theme ---------- */
  function current(){var t=root.getAttribute('data-theme');if(t)return t;return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
  function setTheme(v){if(v==='light'||v==='dark'){root.setAttribute('data-theme',v);store('nl-theme',v)}else{root.removeAttribute('data-theme');store('nl-theme','')}}
  var FONTS={paper:'family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..600&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400',arcade:'family=Nunito:ital,wght@0,500..900;1,600'};
  function setDesign(d){root.setAttribute('data-design',d);store('nl-design',d);
    if(FONTS[d]&&!document.querySelector('link[data-f="'+d+'"]')){var l=document.createElement('link');l.rel='stylesheet';l.setAttribute('data-f',d);l.href='https://fonts.googleapis.com/css2?'+FONTS[d]+'&display=swap';document.head.appendChild(l)}}
  function design(){return root.getAttribute('data-design')||'delft'}

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
      } else if(hs.length>=2&&hs.length<=4&&hs[0]==='dutch'&&hs[1]==='english'&&rows.length>=4){
        var g=document.createElement('div');g.className='words';var hn=[].map.call(t.querySelectorAll('thead th'),function(th){return th.textContent.trim()});
        g.innerHTML=rows.map(function(r){var d=r.children[0].innerHTML,txt=r.children[0].textContent.trim(),art=(txt.match(/^(de|het)\s/i)||[])[1],x='';
          for(var c=2;c<r.children.length;c++)if(r.children[c].textContent.trim())x+='<div class="w-x"><span class="w-xl">'+esc(hn[c]||'')+'</span> '+r.children[c].innerHTML+'</div>';
          return '<div class="wcard'+(art?' a-'+art.toLowerCase():'')+'"><div class="w-nl"><span data-say>'+d+'</span></div><div class="w-en">'+r.children[1].innerHTML+'</div>'+x+'</div>'}).join('');
        w.parentNode.replaceChild(g,w);
      } else if(hs.length>=3){ /* wide tables become stacked rows on a phone */
        t.classList.add('stack');var hn2=[].map.call(t.querySelectorAll('thead th'),function(th){return th.textContent.trim()});
        rows.forEach(function(r){[].forEach.call(r.children,function(td,i){td.setAttribute('data-label',hn2[i]||'')})});
      }
    });
    content.addEventListener('click',function(e){var b=e.target.closest('.tr-btn');if(!b)return;TR=b.getAttribute('aria-pressed')!=='true';store('nl-tr',TR?'on':'off');
      content.querySelectorAll('.chat').forEach(function(c){c.setAttribute('data-tr',TR?'on':'off');var x=c.querySelector('.tr-btn');x.setAttribute('aria-pressed',TR);x.textContent=TR?'Hide English':'Show English'})});
    content.querySelectorAll('p > strong:first-child').forEach(function(st){var m=st.textContent.match(/^(Note|Tip|Notice|Careful|Watch out|Two traps|One trap|Two things|Remember|Important|Rule|Pattern|Step|Key idea|Why)/i);
      if(m&&st.parentNode.parentNode===content||m&&st.parentNode.parentNode.classList&&st.parentNode.parentNode.classList.contains('panel'))st.parentNode.className='callout'+(/careful|watch|trap/i.test(m[1])?' warn':/rule|pattern|key idea/i.test(m[1])?' rule':'')});
  }
  var isUnit=/^(A0|A1|A2|B1|B2|C1)\.\d+$/.test(CODE);
  var LOCKED=isUnit&&!unlocked(CODE);
  if(isUnit){var rec=P.parts[CODE]||{seen:{},total:0};rec.total=parts.length;if(LOCKED){if(!P.parts[CODE])rec.locked=1}else{delete rec.locked;P.last=CODE}P.parts[CODE]=rec;save()}

  /* ---------- Sidebar ---------- */
  var nav=document.getElementById('sidenav');
  function fcDue(){try{return window.NLCards?NLCards.summary().now:0}catch(e){return 0}}
  if(window.NLCards)NLCards.onChange=function(){renderNav()};
  function unitIcon(u){
    if(P.done[u.code])return '<span class="sn-ico done">'+ICON.check+'</span>';
    if(!u.href||!unlocked(u.code))return '<span class="sn-ico locked">'+ICON.lock+'</span>';
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
      +'<a class="sn-link'+(CODE==='cards'?' on':'')+'" href="'+UP+'flashcards.html">'+ICON.cards+'<span>Flashcards</span>'+(fcDue()?'<span class="sn-badge-n" title="Cards to study now">'+fcDue()+'</span>':'')+'</a>'
      +'<a class="sn-link'+(CODE==='plan'?' on':'')+'" href="'+UP+'00-Course-Blueprint.html">'+ICON.map+'<span>Course plan</span></a>'
      +'<a class="sn-link'+(CODE==='settings'?' on':'')+'" href="'+UP+'settings.html">'+ICON.gear+'<span>Settings</span></a></div>'
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
        var cls='sn-unit'+(P.done[u.code]?' done':'')+(u.code===CODE?' current':'')+(!u.href||!unlocked(u.code)?' locked':'');
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
    var tsum=document.createElement('button');tsum.type='button';tsum.className='ptabs-sum';tsum.setAttribute('aria-expanded','false');
    tsum.innerHTML='<span class="ps-k"></span><span class="ps-t"></span><span class="ps-c">Contents '+ICON.chev+'</span>';tabs.insertBefore(tsum,tabs.firstChild);
    tsum.addEventListener('click',function(){var o=!tabs.classList.contains('open');tabs.classList.toggle('open',o);tsum.setAttribute('aria-expanded',o)});
    function paint(){var rec=P.parts[CODE];
      tabs.querySelectorAll('.ptab').forEach(function(t,i){var on=i===curIdx;t.classList.toggle('on',on);t.setAttribute('aria-selected',on);t.classList.toggle('seen',!!rec.seen[parts[i].id])});
      var sc=Object.keys(rec.seen).length,up=nav.querySelector('.sn-uprog');
      var hp=document.querySelector('.hero-prog');if(!hp){hp=document.createElement('div');hp.className='hero-prog';var hr=document.querySelector('.hero');if(hr)hr.appendChild(hp)}
      hp.innerHTML='<span class="track"><i style="width:'+Math.round(100*sc/parts.length)+'%"></i></span><span>'+(P.done[CODE]?'Unit passed':Math.round(100*sc/parts.length)+'% complete · '+sc+' of '+parts.length+' parts')+'</span>';if(up){up.querySelector('i').style.width=(100*sc/parts.length)+'%';up.querySelector('span').textContent=sc+' of '+parts.length+' parts done'}
      var u=nav.querySelector('.sn-unit.current .sn-ico');if(u&&!P.done[CODE]&&Object.keys(rec.seen).length)u.className='sn-ico cur';
    }
    function show(i,scroll){curIdx=Math.max(0,Math.min(i,panels.length-1));
      panels.forEach(function(d,k){d.hidden=k!==curIdx});
      var rec=P.parts[CODE];rec.tab=curIdx;save();
      if(scroll){try{history.replaceState(null,'','#p-'+parts[curIdx].id)}catch(e){}}
      tsum.querySelector('.ps-k').textContent='Part '+(curIdx+1)+' of '+panels.length;tsum.querySelector('.ps-t').textContent=parts[curIdx].name;tabs.classList.remove('open');tsum.setAttribute('aria-expanded','false');
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


  /* ---------- Dashboard ---------- */
  if(CODE==='home'){
    var next=null;
    if(P.last&&!P.done[P.last]&&unlocked(P.last))next=avail.filter(function(u){return u.code===P.last})[0];
    if(!next)next=nextUp();
    var fd=document.getElementById('fc-dash');if(fd&&window.NLCards){var fs=NLCards.summary();fd.hidden=false;
      fd.querySelector('b').textContent=fs.now;fd.querySelector('.fd-sub').textContent=fs.total?(fs.now?fs.due+' to review · '+fs.newLeft+' new · '+fs.learn+' learning':'All caught up for now · '+fs.known+' cards learned'):'Open a unit to get your first cards'}
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
      var d=doneCount(l.units),n=l.units.length,a=l.units.filter(function(u){return u.href}).length,first=l.units.filter(function(u){return u.href&&!P.done[u.code]})[0]||l.units.filter(function(u){return u.href})[0],lk=first&&!unlocked(first.code);
      var st=d===n?'Completed':(d>0||l.units.some(function(u){return P.parts[u.code]}))?'In progress':a?'Ready to start':'Coming soon';
      var stc=d===n?'ok':st==='In progress'?'go':a?'ready':'soon';
      ph+='<li class="lvl lv-'+l.code+'"><div class="lvl-badge">'+l.code+'</div><div class="lvl-main"><div class="lvl-top"><h3>'+esc(l.name)+'</h3><span class="pill '+stc+'">'+st+'</span></div>'
        +'<p>'+esc(l.desc)+'</p><p class="lvl-exam"><span>Exam project</span>'+esc(l.exam)+'</p>'
        +'<div class="lvl-bar"><div class="track"><i style="width:'+(100*d/n)+'%"></i></div><span>'+d+' / '+n+' units done · '+a+' available</span></div></div>'
        +'<div class="lvl-cta">'+(first?'<a class="btn-sec'+(lk?' is-locked':'')+'" href="'+first.href+'">'+(lk?ICON.lock+' Locked':(d?'Continue':'Open')+' '+first.code)+'</a>':'<span class="btn-sec disabled">Coming soon</span>')+'</div></li>';
    });
    path.innerHTML=ph;
  }

  /* ---------- Sound effects (original, made with Web Audio; can be switched off) ---------- */
  window.NLSfx=(function(){
    var A=window.AudioContext||window.webkitAudioContext,ctx=null,ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor"/><path class="sw" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="sx" d="M16 9l5 6M21 9l-5 6"/></svg>';
    if(!A)return null;
    function on(){return store('nl-sfx')!=='off'}
    function ac(){try{if(!ctx)ctx=new A();if(ctx.state==='suspended')ctx.resume();return ctx}catch(e){return null}}
    function tone(f,at,dur,type,vol,f2,filt){var c=ac();if(!c)return;var t=c.currentTime+at,o=c.createOscillator(),g=c.createGain(),n=g;
      o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.012);g.gain.setValueAtTime(vol,t+dur*0.6);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      if(filt){var lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=filt;o.connect(lp);lp.connect(g)}else o.connect(g);
      g.connect(c.destination);o.start(t);o.stop(t+dur+0.05)}
    var S={
      /* the "correct answer" sound: a bright rising ding-ding-ding with a sparkle on top */
      ok:function(){if(!on())return;[[784,0],[1046.5,.08],[1318.5,.16]].forEach(function(n,i){tone(n[0],n[1],i===2?.55:.16,'square',.07,null,3200);tone(n[0],n[1],i===2?.6:.18,'triangle',.2)});
        tone(2637,.16,.5,'sine',.06);[3136,3520,4186,3951].forEach(function(f,i){tone(f,.26+i*.05,.14,'sine',.045)})},
      /* the "wrong answer" buzzer: low, harsh, a little falling */
      no:function(){if(!on())return;tone(116,0,.62,'sawtooth',.2,98,1400);tone(123,0,.62,'square',.12,104,1100)},
      win:function(){if(!on())return;[523.25,659.25,783.99,1046.5].forEach(function(f,i){tone(f,i*.11,i===3?.6:.18,'triangle',.2)})},
      lose:function(){if(!on())return;[392,370,349,330].forEach(function(f,i){tone(f,i*.32,i===3?.75:.3,'sawtooth',.1,i===3?300:null,900)})},
      toggle:function(){return '<button type="button" class="sfx-tg'+(on()?'':' off')+'" aria-pressed="'+on()+'" title="Sound effects">'+ICO+'<span>'+(on()?'Sound on':'Sound off')+'</span></button>'}
    };
    document.addEventListener('click',function(e){var b=e.target.closest('.sfx-tg');if(!b)return;store('nl-sfx',on()?'off':'on');
      document.querySelectorAll('.sfx-tg').forEach(function(x){x.classList.toggle('off',!on());x.setAttribute('aria-pressed',on());x.querySelector('span').textContent=on()?'Sound on':'Sound off'});if(on())S.ok()});
    document.addEventListener('pointerdown',function(){if(on())ac()},{passive:true});
    return S})();

  /* ---------- Bottom tab bar (shown by the Arcade design on phones) ---------- */
  (function(){
    var nx=nextUp(),learn=isUnit?location.pathname.split('/').pop():(nx?UP+nx.href:UP+'index.html'),due=fcDue();
    var b=document.createElement('nav');b.className='bnav';b.setAttribute('aria-label','Main');
    function it(href,on,ico,t,badge){return '<a href="'+href+'"'+(on?' class="on" aria-current="page"':'')+'>'+ico+'<span>'+t+'</span>'+(badge?'<b>'+badge+'</b>':'')+'</a>'}
    b.innerHTML=it(UP+'index.html',CODE==='home',ICON.home,'Home')+it(learn,isUnit,ICON.book,'Learn')+it(UP+'flashcards.html',CODE==='cards',ICON.cards,'Cards',due)+it(UP+'settings.html',CODE==='settings',ICON.gear,'Settings');
    body.appendChild(b);
    if(isUnit)b.querySelectorAll('a')[1].addEventListener('click',function(e){var mb=document.querySelector('.menu-btn');if(mb&&window.innerWidth<=960){e.preventDefault();mb.click()}});
  })();

  /* ---------- Settings page ---------- */
  if(CODE==='settings'){(function(){
    var box=document.getElementById('settings');if(!box)return;
    var sfxOn=function(){return store('nl-sfx')!=='off'};
    function fcp(){return window.NLCards&&NLCards.prefs?NLCards.prefs():{newLimit:20,auto:true}}
    var get={theme:function(){return store('nl-theme')||'auto'},rate:function(){return String(parseFloat(store('nl-rate'))||0.8)},fcnew:function(){return String(fcp().newLimit)},
      sfx:sfxOn,tr:function(){return store('nl-tr')!=='off'},fcauto:function(){return !!fcp().auto}};
    var set={theme:setTheme,rate:function(v){store('nl-rate',v);try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance('Hallo! Zo klink ik.');u.lang='nl-NL';u.rate=+v;speechSynthesis.speak(u)}catch(e){}},
      fcnew:function(v){window.NLCards&&NLCards.prefs&&NLCards.prefs({newLimit:+v})},
      sfx:function(v){store('nl-sfx',v?'on':'off');if(v&&window.NLSfx)NLSfx.ok()},tr:function(v){store('nl-tr',v?'on':'off')},
      fcauto:function(v){window.NLCards&&NLCards.prefs&&NLCards.prefs({auto:v})}};
    function paintAll(){
      box.querySelectorAll('.design').forEach(function(d){var on=d.getAttribute('data-design')===design();d.classList.toggle('on',on);d.setAttribute('aria-checked',on)});
      box.querySelectorAll('.seg').forEach(function(g){var v=get[g.getAttribute('data-pref')]();g.querySelectorAll('button').forEach(function(b){var on=b.getAttribute('data-v')===v;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)})});
      box.querySelectorAll('.switch').forEach(function(w){w.setAttribute('aria-checked',!!get[w.getAttribute('data-pref')]())})}
    box.addEventListener('click',function(e){
      var d=e.target.closest('.design');if(d){setDesign(d.getAttribute('data-design'));paintAll();return}
      var sb=e.target.closest('.seg button');if(sb){var k=sb.parentNode.getAttribute('data-pref');set[k](sb.getAttribute('data-v'));paintAll();return}
      var w=e.target.closest('.switch');if(w){var k2=w.getAttribute('data-pref');set[k2](!get[k2]());paintAll();return}
    });
    paintAll();
    /* backup / restore / reset */
    var code=box.querySelector('.set-code'),ta=code.querySelector('textarea'),go=code.querySelector('.set-code-go'),msg=code.querySelector('.set-code-msg'),mode='';
    function keys(){var k=[];try{for(var i=0;i<localStorage.length;i++){var n=localStorage.key(i);if(/^nl-/.test(n)&&n!=='nl-upd-check'&&n!=='nl-upd-later')k.push(n)}}catch(e){}return k}
    box.querySelector('.set-backup').addEventListener('click',function(){var o={v:1};keys().forEach(function(k){o[k]=store(k)});
      ta.value='LANGUA1:'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));ta.readOnly=true;code.hidden=false;mode='copy';go.textContent='Copy the code';msg.textContent='Keep this code somewhere safe, for example in a note or an email to yourself.';ta.select()});
    box.querySelector('.set-restore').addEventListener('click',function(){ta.value='';ta.readOnly=false;code.hidden=false;mode='restore';go.textContent='Restore my progress';msg.textContent='';ta.focus()});
    go.addEventListener('click',function(){
      if(mode==='copy'){ta.select();var ok=false;try{navigator.clipboard.writeText(ta.value);ok=true}catch(e){}try{ok=document.execCommand('copy')||ok}catch(e){}msg.textContent=ok?'Copied.':'Select the code and copy it.';return}
      try{var t=ta.value.trim().replace(/^LANGUA1:/,''),o=JSON.parse(decodeURIComponent(escape(atob(t))));if(!o||o.v!==1)throw 0;
        keys().forEach(function(k){try{localStorage.removeItem(k)}catch(e){}});Object.keys(o).forEach(function(k){if(/^nl-/.test(k)&&typeof o[k]==='string')store(k,o[k])});
        msg.textContent='Restored. Reloading…';setTimeout(function(){location.reload()},700)}catch(e){msg.textContent='That code does not look right. Copy the whole code and try again.'}});
    var rs=box.querySelector('.set-reset'),armed=null;
    rs.addEventListener('click',function(){
      if(!armed){rs.textContent='Tap again to erase everything';rs.classList.add('danger');armed=setTimeout(function(){armed=null;rs.textContent='Erase my progress';rs.classList.remove('danger')},5000);return}
      clearTimeout(armed);['nl-progress','nl-srs'].concat(keys().filter(function(k){return /^nl-tasks:/.test(k)})).forEach(function(k){try{localStorage.removeItem(k)}catch(e){}});
      rs.textContent='Progress erased';rs.disabled=true;setTimeout(function(){location.href=UP+'index.html'},900)});
  })()}

  /* ---------- Flashcards page ---------- */
  if(CODE==='cards'&&window.NLCards){var fcEl=document.getElementById('fc');if(fcEl)NLCards.mount(fcEl,UP)}

  if(!content)return;

  /* ---------- Hidden answers ---------- */
  var all=[],EXS=[];
  function makeReveal(node){
    var wrap=document.createElement('span');wrap.className='ans';
    var btn=document.createElement('button');btn.type='button';btn.className='ans-btn';btn.textContent='Show answer';
    var val=document.createElement('span');val.className='ans-val';val.hidden=true;val.appendChild(node);
    btn.addEventListener('click',function(){var o=val.hidden;val.hidden=!o;btn.textContent=o?'Hide':'Show answer'});
    wrap.appendChild(btn);wrap.appendChild(val);all.push([btn,val]);return wrap;
  }
  content.querySelectorAll('strong').forEach(function(s){
    if(!/^Answer:/.test(s.textContent)||s.closest('.ans'))return;
    /* "(a) ... (b) ... Answer: b" becomes a tap-to-choose question */
    var li0=s.closest('li'),mc=s.textContent.match(/^Answer:\s*\(?([a-d])\)?\.?\s*$/i);
    if(li0&&mc&&!(s.nextSibling&&s.nextSibling.textContent.trim())&&/\(a\)[\s\S]*\(b\)/.test(li0.textContent)){var hp=s.parentNode;s.remove();hp.appendChild(document.createTextNode(' [[mc:'+mc[1].toLowerCase()+']]'));return}
    var frag=document.createDocumentFragment(),n=s.nextSibling,parent=s.parentNode;
    frag.appendChild(s.cloneNode(true));while(n){var nx=n.nextSibling;frag.appendChild(n);n=nx}
    parent.replaceChild(makeReveal(frag),s);parent.setAttribute('data-done','1');
  });
  /* Numbered drills with the answer in brackets at the end become checkable exercises.
     Other lists (instructions, notes) keep a "Show answer" button. */
  content.querySelectorAll('ol').forEach(function(ol){
    if(ol.closest('blockquote')||ol.closest('.sn-parts'))return;
    var lis=[].filter.call(ol.children,function(li){return li.tagName==='LI'}),hits=lis.map(function(li){
      var host=li.querySelector(':scope > p')||li;if(host.getAttribute('data-done')||li.querySelector('.ans')||/\[\[[^\]]+\]\]\s*$/.test(host.innerHTML))return null;
      var last=host.lastChild;while(last&&last.nodeType===3&&!last.textContent.trim())last=last.previousSibling;
      if(!last||last.nodeType!==3)return null;
      var t=last.textContent,m=t.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/);return m?{host:host,last:last,t:t,m:m}:null}),
      n=hits.filter(Boolean).length,drill=n>=2&&n>=lis.length*0.6;
    hits.forEach(function(x){if(!x)return;var a=x.m[1].trim();x.last.textContent=x.t.slice(0,x.m.index);
      if(!drill){x.host.appendChild(makeReveal(document.createTextNode(a)));return}
      var self=a.split(/\s+/).length>9||/^(because|any\b|e\.g\.|for example|think|answers? (will )?vary)/i.test(a)||(a.match(/,/g)||[]).length>=2||/[^\d]:\s/.test(a.replace(/\bOr:\s*/gi,''));
      var ans=self?a:a.replace(/\s*\bOr:\s*/gi,'|').replace(/\s+\/\s+/g,'|');
      x.host.appendChild(document.createTextNode(' [['+(self?'?':'')+ans.replace(/\]/g,')')+']]'))});
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
          if(m==='no-match'){out.hidden=false;out.innerHTML='<span class="eyebrow">Heard</span> something, but not these Dutch words';mark(li,false,'Score 0%. That didn\u2019t match the sentence. Listen to the model, then try again.');return}
          fb.innerHTML=m==='no-speech'?'I heard nothing. Click and speak a little louder, close to the microphone.':m==='aborted'?'Stopped.':m==='network'?'The speech check needs an internet connection (Chrome and Edge use their free online speech service). You can still hear yourself below.':m==='language-not-supported'?(window.Capacitor?'Your phone can\u2019t recognise Dutch yet. In the Google app: Settings, Voice, Languages, add Nederlands. Then try again.':'This browser has no Dutch speech check. Use Chrome or Edge, or hear yourself below and compare.'):m==='audio-capture'?micHelp('NotReadableError'):micHelp(m,true)};
        r.onend=function(){if(take===me){try{me.rec&&me.rec.state!=='inactive'&&me.rec.stop()}catch(e){}me.done()}};
        try{r.start()}catch(err){fb.textContent='Click again to start the microphone.';stopTake()}
        me.timer=setTimeout(stopTake,15000)}
      else me.timer=setTimeout(stopTake,8000)}
    /* ---- sounds: original synthesised effects, no files. Correct = bright chime, wrong = game-show buzzer ---- */
    var sfx=window.NLSfx;
    /* ---- the tick / cross that pops in after an answer ---- */
    var BADGE={ok:'<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M14 27.5l8 8 16-17"/></svg>',
      no:'<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M18 18l16 16M34 18L18 34"/></svg>'};
    function mark(li,good,msg,quiet){
      li.classList.toggle('ex-ok',good);li.classList.toggle('ex-no',!good);
      var f=li.querySelector('.ex-fb');if(f)f.textContent=msg||(good?'Correct!':'Not quite.');
      var old=li.querySelector('.ex-badge');if(old)old.remove();
      if(f){var bd=document.createElement('span');bd.className='ex-badge '+(good?'ok':'no');bd.innerHTML=BADGE[good?'ok':'no'];f.parentNode.insertBefore(bd,f)}
      li.classList.remove('ex-pop','ex-shake');void li.offsetWidth;li.classList.add(good?'ex-pop':'ex-shake');
      if(!quiet&&sfx)sfx[good?'ok':'no']();
      li.dispatchEvent(new CustomEvent('ex-result',{detail:{good:good}}));
    }
    /* Blanks: each run of ___ (or ___ ___) becomes one box; "komt ... aan" fills two boxes. */
    var BL=/_{3,}(?:[  ]+_{3,})*/g;
    function blanks(h,ans,cls){var shown=ans.split('|')[0],ps=shown.split(/\s*(?:\.\.\.|…)\s*/),k=0,cnt=(h.match(BL)||[]).length;
      function box(stem){var part=cnt===ps.length?ps[k]:shown,w=Math.max(4,Math.min(26,Math.ceil(part.length/(cnt===ps.length?1:Math.max(cnt,1)))+2));k++;
        return '<input type="text" class="ex-in '+(cls||'')+'" data-stem="'+esc(stem||'')+'" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:'+w+'ch" aria-label="Your answer">'}
      if(!cnt)return h+' '+box('');
      return h.replace(BL,function(m0,off){var st=(h.slice(0,off).match(/[A-Za-zÀ-ÿ]+$/)||[''])[0];return box(st)})}
    function readBlanks(el){return [].map.call(el.querySelectorAll('.ex-in'),function(i){var v=i.value.trim(),st=i.getAttribute('data-stem');
      if(st&&norm(v).indexOf(norm(st))!==0)v=st+v;return v}).join(' ')}
    window.NLBlanks={html:blanks,read:readBlanks};
    /* Extra "decoy" words for word-tile exercises, taken from the other tile sentences on this page. */
    var POOL=[],FILL=['niet','ook','de','het','een','er','wel','al','nog','graag','heel','maar','en','ik','je','is'];
    (content.innerHTML.match(/\{\{([^}]+)\}\}/g)||[]).forEach(function(x){x.slice(2,-2).split(' / ').forEach(function(w){w=w.trim();if(w&&POOL.indexOf(w)<0)POOL.push(w)})});
    function decoys(tiles){var have=tiles.map(function(t){return norm(t)}),want=Math.min(4,Math.max(2,Math.ceil(tiles.length/2))),out=[];
      var src=POOL.slice().sort(function(){return Math.random()-.5}).concat(FILL.slice().sort(function(){return Math.random()-.5}));
      for(var i=0;i<src.length&&out.length<want;i++){var w=src[i],nw=norm(w);if(!nw||have.indexOf(nw)>=0||out.some(function(o){return norm(o)===nw}))continue;
        if(/^[A-Z]/.test(w)&&!/^(Ik|U)$/.test(w))w=w.charAt(0).toLowerCase()+w.slice(1); /* capitals would give the answer away */
        if(have.indexOf(norm(w))<0)out.push(w)}
      return out}
    window.NLDecoys=decoys;
    function shuffled(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
    content.querySelectorAll('li').forEach(function(li){
      var host=li.querySelector(':scope > p')||li,h=host.innerHTML,m=h.match(/\[\[([^\]]+)\]\]\s*$/);if(!m)return;
      var ans=m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();h=h.slice(0,m.index).replace(/\s+$/,'');li.classList.add('ex');host.setAttribute('data-done','1');
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
        sayItems.push(li);groups.indexOf(li.parentNode)<0&&groups.push(li.parentNode);
        return;
      }
      var row=document.createElement('div');row.className='ex-row';
      if(/^mc:[a-d]$/.test(ans)){var right=ans.slice(3),om=[],re=/\(([a-d])\)\s*/g,mm;while((mm=re.exec(h)))om.push({k:mm[1],i:mm.index,e:re.lastIndex});
        if(om.length>=2){li.classList.add('ex-mc');
          var opts=om.map(function(o,j){return {k:o.k,t:h.slice(o.e,j+1<om.length?om[j+1].i:h.length).replace(/[\s.;,]+$/,'')}});
          host.innerHTML='<span class="mc-q">'+h.slice(0,om[0].i).trim()+'</span><span class="mc-opts">'+opts.map(function(o){return '<button type="button" class="mc-opt" data-k="'+o.k+'"><b>'+o.k.toUpperCase()+'</b><span>'+o.t+'</span></button>'}).join('')+'</span>';
          row.innerHTML='<span class="ex-fb" aria-live="polite"></span>';host.appendChild(row);
          host.querySelector('.mc-opts').addEventListener('click',function(e){var b=e.target.closest('.mc-opt');if(!b||li.classList.contains('ex-locked'))return;
            b.classList.add('on');var good=b.getAttribute('data-k')===right;if(good)b.classList.add('right');mark(li,good,good?'Correct!':'Not quite.');li.classList.add('ex-locked')});
          li._reveal=function(){var r=host.querySelector('.mc-opt[data-k="'+right+'"]');if(r)r.classList.add('right')};
          li._reset=function(){li.classList.remove('ex-locked');host.querySelectorAll('.mc-opt').forEach(function(b){b.classList.remove('on','right')})};
          li._lock=function(){li.classList.add('ex-locked')};
          groups.indexOf(li.parentNode)<0&&groups.push(li.parentNode);return}
        ans='?'+right.toUpperCase()}
      if(ans.charAt(0)==='?'){ /* open answer: think, look, then say how you did */
        ans=ans.slice(1);li.classList.add('ex-self');host.innerHTML=h;
        row.innerHTML='<button type="button" class="ex-check ex-peek">Show the answer</button><span class="ex-fb" aria-live="polite"></span>';
        host.appendChild(row);
        var sh=document.createElement('div');sh.className='ex-show';sh.hidden=true;sh.innerHTML='<span class="eyebrow">Answer</span> <span class="ex-show-t"></span><div class="ex-self-btns"><button type="button" class="btn-sec ex-iwr">I got it</button><button type="button" class="btn-sec ex-inot">Not yet</button></div>';
        sh.querySelector('.ex-show-t').textContent=ans;host.appendChild(sh);
        row.querySelector('.ex-peek').addEventListener('click',function(){sh.hidden=false;sh.querySelector('.ex-self-btns').hidden=false;this.hidden=true});
        sh.querySelector('.ex-iwr').addEventListener('click',function(){sh.querySelector('.ex-self-btns').hidden=true;mark(li,true,'Well done!')});
        sh.querySelector('.ex-inot').addEventListener('click',function(){sh.querySelector('.ex-self-btns').hidden=true;mark(li,false,'Read the answer again.',true)});
        li._reset=function(){sh.hidden=true;row.querySelector('.ex-peek').hidden=false};
        groups.indexOf(li.parentNode)<0&&groups.push(li.parentNode);
        return;
      }
      var shown=ans.split('|')[0],tm=h.match(/\{\{([^}]+)\}\}/),ctl,reset;EXS.push({h:h,ans:ans,tiles:tm?tm[1]:null});
      if(tm){
        host.innerHTML=h.slice(0,tm.index)+'<span class="tl-slot"></span>'+h.slice(tm.index+tm[0].length);
        var tiles=tm[1].split(' / ').map(function(t){return t.trim()}).filter(Boolean),all=tiles.concat(decoys(tiles)),order;
        function deal(){order=shuffled(all);for(var k=0;k<8&&order.slice(0,tiles.length).join(' ')===tiles.join(' ')&&tiles.length>1;k++)order=shuffled(all);
          bank.innerHTML=order.map(function(t){return '<button type="button" class="tile">'+t+'</button>'}).join('');line.innerHTML='<span class="tl-ph">Tap the words in the right order. Some words are not needed.</span>'}
        var box=document.createElement('div');box.className='tl';box.innerHTML='<div class="tl-line" aria-label="Your sentence"></div><div class="tl-bank"></div>';
        host.querySelector('.tl-slot').replaceWith(box);
        var line=box.querySelector('.tl-line'),bank=box.querySelector('.tl-bank');deal();
        box.addEventListener('click',function(e){var t=e.target.closest('.tile');if(!t||li.classList.contains('ex-locked'))return;(t.parentNode===bank?line:bank).appendChild(t);
          line.querySelector('.tl-ph').hidden=!!line.querySelector('.tile');if(!li.classList.contains('ex-locked')){li.classList.remove('ex-ok','ex-no');var f=li.querySelector('.ex-fb');if(f)f.textContent='';var bd=li.querySelector('.ex-badge');if(bd)bd.remove()}});
        ctl=function(){return [].map.call(line.querySelectorAll('.tile'),function(t){return t.textContent}).join(' ')};
        reset=deal;
      } else {
        host.innerHTML=blanks(h,ans);
        ctl=function(){return readBlanks(host)};
        host.querySelectorAll('.ex-in').forEach(function(input,i,arr){
          input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();if(arr[i+1]&&!arr[i+1].value)arr[i+1].focus();else check()}});
          input.addEventListener('input',function(){li.classList.remove('ex-ok','ex-no')})});
        reset=function(){host.querySelectorAll('.ex-in').forEach(function(i){i.value='';i.disabled=false})};
      }
      row.innerHTML='<button type="button" class="ex-check">Check</button><span class="ex-fb" aria-live="polite"></span>';
      host.appendChild(row);
      var sh2=document.createElement('div');sh2.className='ex-show';sh2.hidden=true;sh2.innerHTML='<span class="eyebrow">Answer</span> <span class="ex-show-t"></span> <button type="button" class="linkish ex-iwr">I was right</button>';
      sh2.querySelector('.ex-show-t').textContent=shown.replace(/\s*(\.\.\.|…)\s*/g,' … ');host.appendChild(sh2);
      sh2.querySelector('.ex-iwr').addEventListener('click',function(){sh2.querySelector('.ex-iwr').hidden=true;mark(li,true,'Marked as right.')});
      function check(){if(li.classList.contains('ex-locked'))return;var v=ctl();
        if(!norm(v)&&!(host.querySelector('.ex-in[data-stem]:not([data-stem=""])'))){var f=li.querySelector('.ex-fb');f.textContent=tm?'Tap the words first.':'Type your answer first.';return}
        mark(li,okAns(v,ans))}
      row.querySelector('.ex-check').addEventListener('click',check);
      li._reveal=function(){sh2.hidden=false;sh2.querySelector('.ex-iwr').hidden=false};
      li._reset=function(){reset();sh2.hidden=true;li.classList.remove('ex-locked')};
      li._lock=function(){li.classList.add('ex-locked');host.querySelectorAll('.ex-in').forEach(function(i){i.disabled=true})};
      li._focus=function(){var i=host.querySelector('.ex-in');if(i)try{i.focus({preventScroll:true})}catch(e){}};
      groups.indexOf(li.parentNode)<0&&groups.push(li.parentNode);
    });
    /* ---- One question at a time. Missed questions come back at the end of the set. ---- */
    function stepper(list){
      var items=[].filter.call(list.children,function(li){return li.classList&&li.classList.contains('ex')});if(!items.length)return;
      if(items.length<2){var miss=0;items[0].addEventListener('ex-result',function(e){if(!e.detail.good&&++miss>=2&&items[0]._reveal)items[0]._reveal()});return}
      list.classList.add('ex-steps');
      var head=document.createElement('div');head.className='st-head';
      head.innerHTML='<span class="st-count"></span><span class="st-dots">'+items.map(function(){return '<i></i>'}).join('')+'</span>'+(sfx?sfx.toggle():'');
      list.parentNode.insertBefore(head,list);
      var sum=document.createElement('div');sum.className='st-sum';sum.hidden=true;list.parentNode.insertBefore(sum,list.nextSibling);
      var q,pos,cur,tries,firstOk;
      items.forEach(function(li){
        var act=document.createElement('div');act.className='st-act';
        act.innerHTML='<span class="st-note"></span><span class="st-btns">'+(li.classList.contains('ex-say')?'<button type="button" class="btn-sec st-skip">Skip</button>':'')+'<button type="button" class="btn-primary st-next" hidden>Next &rarr;</button></span>';
        (li.querySelector(':scope > p')||li).appendChild(act);
        act.querySelector('.st-next').addEventListener('click',next);
        var sk=act.querySelector('.st-skip');if(sk)sk.addEventListener('click',function(){if(li.st!=='ok'&&q.lastIndexOf(li)<=pos&&(tries.get(li)||0)<2){tries.set(li,(tries.get(li)||0)+1);q.push(li)}next()});
        li.addEventListener('ex-result',function(e){if(li!==cur)return;var n=tries.get(li)||0,note=act.querySelector('.st-note'),nb=act.querySelector('.st-next'),say=li.classList.contains('ex-say');
          if(e.detail.good){if(li.st!=='ok'&&!n)firstOk++;li.st='ok';var j=q.lastIndexOf(li);if(j>pos)q.splice(j,1);
            note.textContent='';li._lock&&li._lock();}
          else{if(li.missed)return;li.missed=true;n++;tries.set(li,n);li.st='no';li._lock&&li._lock();
            if(n>=2&&li._reveal)li._reveal();
            if(n<3&&q.lastIndexOf(li)<=pos){q.push(li);note.textContent=n>=2?'Look at the answer. You get one more try at the end.':'Keep going. This one comes back at the end so you can try again.'}
            else note.textContent='Look at the answer, then move on.';
            if(say)note.textContent+=' Or tap Say it again now.'}
          nb.hidden=false;nb.innerHTML=(pos>=q.length-1?'See my results':'Next')+' &rarr;';var sk2=act.querySelector('.st-skip');if(sk2)sk2.hidden=true;paint();
          try{nb.focus({preventScroll:true})}catch(x){}});
      });
      function paint(){var dots=head.querySelectorAll('.st-dots i');items.forEach(function(li,i){dots[i].className=(li===cur?'cur ':'')+(li.st||'')});
        var done=items.filter(function(li){return li.st==='ok'}).length;
        head.querySelector('.st-count').textContent=!cur?'Finished · '+done+' of '+items.length+' right':pos<items.length?'Question '+(pos+1)+' of '+items.length:'Try again · '+(q.length-pos)+' left'}
      function show(li){cur=li;items.forEach(function(x){x.hidden=x!==li});
        if(li.st){li.classList.remove('ex-ok','ex-no');var b=li.querySelector('.ex-badge');if(b)b.remove();var f=li.querySelector('.ex-fb');if(f)f.textContent='';li._reset&&li._reset();var h=li.querySelector('.ex-heard');if(h)h.hidden=true}
        var act=li.querySelector('.st-act');act.querySelector('.st-next').hidden=true;act.querySelector('.st-note').textContent=(tries.get(li)?'Second try. You can do it.':'');var sk=act.querySelector('.st-skip');if(sk)sk.hidden=false;
        li.missed=false;paint()}
      function next(){var r=head.getBoundingClientRect();pos++;
        if(pos>=q.length){finish();return}
        show(q[pos]);if(cur._focus)cur._focus();if(r.top<0||r.top>window.innerHeight*.6)head.scrollIntoView({behavior:'smooth',block:'start'})}
      function finish(){cur=null;items.forEach(function(x){x.hidden=true});paint();
        var ok=items.filter(function(li){return li.st==='ok'}).length,all=ok===items.length;
        sum.hidden=false;sum.innerHTML='<div class="st-trophy">'+BADGE[all?'ok':'no']+'</div><div><h4>'+(all&&firstOk===items.length?'Perfect! Every answer right first time.':all?'All done! You got them all in the end.':'Set finished')+'</h4><p>'+firstOk+' of '+items.length+' right first time'+(ok>firstOk?', '+(ok-firstOk)+' more on the second try':'')+(ok<items.length?'. '+(items.length-ok)+' still to learn: read that part again and practise once more.':'.')+'</p></div><button type="button" class="btn-sec st-again">Practise again</button>';
        sum.querySelector('.st-again').addEventListener('click',start);if(sfx)sfx[ok>=items.length*0.8?'win':'lose']();
        var r=head.getBoundingClientRect();if(r.top<0)head.scrollIntoView({behavior:'smooth',block:'start'})}
      function start(){q=items.slice();pos=0;tries=new Map();firstOk=0;sum.hidden=true;items.forEach(function(li){li.st='';li.classList.remove('ex-ok','ex-no');var b=li.querySelector('.ex-badge');if(b)b.remove();li._reset&&li._reset()});
        show(q[0])}
      start();
    }
    groups.forEach(stepper);
    if(isFile&&sayItems.length){var n=document.createElement('p');n.className='callout warn mic-note';
      n.innerHTML='<strong>Microphone:</strong> you opened this page straight from a folder, so the browser will keep asking for the microphone and the speaking checks will not work. Close the browser and double-click '+START+' in your course folder instead. The course then runs at <b>localhost</b> and the microphone works after you allow it once.';
      var l0=sayItems[0].parentNode;l0.parentNode.insertBefore(n,l0)}
  })();

  /* ---------- Task cards: every exercise, writing, speaking, reading or listening task stands out ---------- */
  (function(){
    var TI={practice:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
      write:'<path d="M4 4h16v12H5.2L4 17.2z"/><path d="M8 8h8M8 12h5"/>',
      speak:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
      read:'<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
      listen:'<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"/>',
      check:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>'};
    var NAME={practice:'Practice',write:'Writing task',speak:'Speaking task',read:'Reading task',listen:'Listening task',check:'Your task'};
    function ico(k){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+TI[k]+'</svg>'}
    function sectionOf(h){var out=[],n=h.nextSibling;while(n&&!(n.nodeType===1&&(/^H[23]$/.test(n.tagName)||n.classList.contains('pnav')||n.classList.contains('complete-box')))){out.push(n);n=n.nextSibling}return out}
    function kind(title,nodes){var t=title.toLowerCase(),has=function(sel){return nodes.some(function(n){return n.nodeType===1&&(n.matches(sel)||n.querySelector(sel))})},txt=nodes.map(function(n){return n.textContent}).join(' ');
      var model=/Model answer|^\s*Model:/m.test(txt),ex=has('li.ex'),tl=has('.task-list');
      if(/marking guide/.test(t))return null;
      if(/listen|voicemail|heard/.test(t)&&(ex||has('.ans')))return 'listen';
      if(/\bread|^dialogue|letter|text\b/.test(t)&&(ex||has('.ans')))return 'read';
      if(/\b(record|recording|role-?play|speak|speaking|say it)\b/.test(t)||(model&&/\bsay\b|\brecord\b/i.test(txt)&&!/write/i.test(t)))return 'speak';
      if(!ex&&(model||/^(write|an? (email|message|note|letter)|your short profile|exam part d)/.test(t)||/\bwrite\b/i.test(txt.slice(0,200))&&tl))return 'write';
      if(ex)return 'practice';
      if(tl)return 'check';
      return null}
    var tasks=[];
    [].slice.call(content.querySelectorAll('.panel > h3, .content > h3')).forEach(function(h){
      var nodes=sectionOf(h),k=kind(h.textContent,nodes);if(!k)return;
      var raw=h.textContent.trim(),m=raw.match(/\s*\(([^()]*)\)\s*$/),title=m?raw.slice(0,m.index):raw,meta=m?m[1]:'';
      title=title.replace(/^(\d+[A-Z]\.|Practice:)\s*/,'');
      var card=document.createElement('section');card.className='task t-'+k;
      card.innerHTML='<header class="task-h"><span class="task-ico">'+ico(k)+'</span><div class="task-ht"><span class="task-k">'+NAME[k]+(meta?' · '+esc(meta):'')+'</span></div></header><div class="task-b"></div>';
      h.parentNode.insertBefore(card,h);h.textContent=title;h.classList.add('task-title');card.querySelector('.task-ht').appendChild(h);
      var b=card.querySelector('.task-b');nodes.forEach(function(n){b.appendChild(n)});
      tasks.push({card:card,k:k,title:title,meta:meta});
      /* in writing and speaking tasks, brackets are hints, not hidden answers */
      if(k==='write'||k==='speak')card.querySelectorAll('.ans').forEach(function(x){var v=x.querySelector('.ans-val');x.replaceWith(document.createTextNode('('+(v?v.textContent:'')+')'))});
    });
    /* Writing: a box to write in, a word count, then the model answer and a marking guide to score yourself */
    tasks.forEach(function(t,ti){if(t.k!=='write')return;var b=t.card.querySelector('.task-b');
      var mp=[].filter.call(b.children,function(n){return /^Model answer/.test((n.querySelector&&n.querySelector('strong')||{}).textContent||'')})[0];
      var model=document.createElement('div');model.className='task-model';model.hidden=true;
      if(mp){var n=mp;while(n){var nx=n.nextSibling;model.appendChild(n);n=nx}}
      /* a following "Marking guide" section joins this card */
      var nx2=t.card.nextElementSibling,guide=null;
      if(nx2&&nx2.tagName==='H3'&&/marking guide/i.test(nx2.textContent)){guide=document.createElement('div');guide.className='task-guide';var gn=sectionOf(nx2);nx2.remove();gn.forEach(function(x){guide.appendChild(x)})}
      var wm=(t.meta.match(/(\d+)\s*(?:[–-]|to)\s*(\d+)\s*words/)||[]),lo=+wm[1]||0,hi=+wm[2]||0,k='nl-write:'+CODE+':'+ti;
      var w=document.createElement('div');w.className='task-write';
      w.innerHTML='<label class="task-lbl" for="tw-'+ti+'">Write your answer here</label><textarea id="tw-'+ti+'" rows="7" spellcheck="false" autocapitalize="sentences" placeholder="Hoi …"></textarea>'
        +'<div class="task-wc"><span class="wc"></span>'+(lo?'<span class="wc-aim">Aim for '+lo+'–'+hi+' words</span>':'')+'</div>'
        +'<div class="task-acts">'+(mp?'<button type="button" class="btn-primary task-cmp">Done: compare with the model</button>':'')+'</div>';
      b.appendChild(w);if(mp)b.appendChild(model);
      var ta=w.querySelector('textarea'),wc=w.querySelector('.wc');ta.value=store(k)||'';
      function cnt(){var n=(ta.value.trim().match(/\S+/g)||[]).length;wc.textContent=n+' word'+(n===1?'':'s');w.classList.toggle('in-range',!!lo&&n>=lo&&n<=hi+10);w.classList.toggle('too-few',!!lo&&n>0&&n<lo)}
      ta.addEventListener('input',function(){store(k,ta.value);cnt()});cnt();
      var cmp=w.querySelector('.task-cmp');if(cmp)cmp.addEventListener('click',function(){model.hidden=false;cmp.hidden=true;if(guide)guide.hidden=false;model.scrollIntoView({behavior:'smooth',block:'nearest'})});
      if(guide){guide.hidden=true;b.appendChild(guide);var tb=guide.querySelector('table'),pass=(guide.textContent.match(/Pass:\s*(\d+)\s*out of\s*(\d+)/)||[]);
        if(tb){var hs=[].map.call(tb.querySelectorAll('thead th'),function(x){return x.textContent.trim()}),rows=[].slice.call(tb.querySelectorAll('tbody tr'));
          if(/criterion/i.test(hs[0])&&hs.length>=3){
            var r=document.createElement('div');r.className='rubric';
            r.innerHTML='<p class="task-lbl">Mark your writing: tap what fits for each line</p>'+rows.map(function(row,i){var c=[].slice.call(row.children);
              return '<div class="rb-row"><b>'+c[0].innerHTML+'</b><div class="rb-opts">'+c.slice(1).map(function(td,j){return '<button type="button" class="rb-opt" data-i="'+i+'" data-p="'+(parseInt(hs[j+1])||j)+'"><span>'+(parseInt(hs[j+1])||j)+'</span>'+td.innerHTML+'</button>'}).join('')+'</div></div>'}).join('')
              +'<p class="rb-total" aria-live="polite"></p>';
            var w2=tb.closest('.tw')||tb;w2.parentNode.replaceChild(r,w2);
            var sc={},max=rows.length*(parseInt(hs[hs.length-1])||2),need=+pass[1]||Math.ceil(max*.6);
            r.addEventListener('click',function(e){var o=e.target.closest('.rb-opt');if(!o)return;var i=o.getAttribute('data-i');
              r.querySelectorAll('.rb-opt[data-i="'+i+'"]').forEach(function(x){x.classList.toggle('on',x===o)});sc[i]=+o.getAttribute('data-p');
              var tot=0,n=0;for(var q in sc){tot+=sc[q];n++}var tt=r.querySelector('.rb-total');
              if(n<rows.length){tt.textContent=tot+' points so far';return}
              tt.innerHTML='<b>'+tot+' out of '+max+'</b> · '+(tot>=need?'Passed! Well done.':'You need '+need+'. Look at the model, improve your text and mark it again.');tt.className='rb-total '+(tot>=need?'ok':'no');
              if(window.NLSfx)NLSfx[tot>=need?'win':'no']()});
            [].forEach.call(guide.querySelectorAll('p'),function(p){if(/Pass:/.test(p.textContent))p.remove()})}}}
    });
    /* Speaking: the model stays hidden until you've tried; a timer for timed recordings */
    tasks.forEach(function(t){if(t.k!=='speak')return;var b=t.card.querySelector('.task-b');
      var mp=[].filter.call(b.children,function(n){return /^Model/.test((n.querySelector&&n.querySelector('strong')||{}).textContent||'')})[0];
      var acts=document.createElement('div');acts.className='task-acts';var secs=+(t.meta.match(/(\d+)\s*seconds/)||[])[1]||0,mins=+(t.meta.match(/(\d+)\s*minutes/)||[])[1]||0,dur=secs||mins*60;
      if(dur)acts.innerHTML='<button type="button" class="btn-primary task-timer"><span>Start the '+(secs?secs+'-second':mins+'-minute')+' timer</span></button>';
      if(mp){acts.innerHTML+='<button type="button" class="btn-sec task-model-btn">Show the model</button>';var md=document.createElement('div');md.className='task-model';md.hidden=true;md.appendChild(mp);
        var ls=document.createElement('button');ls.type='button';ls.className='btn-sec task-listen';ls.textContent='Listen to the model';md.appendChild(ls);
        ls.addEventListener('click',function(){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(mp.textContent.replace(/^Model:\s*/,'').replace(/["“”]/g,''));u.lang='nl-NL';u.rate=parseFloat(store('nl-rate'))||0.8;speechSynthesis.speak(u)}catch(e){}});
        b.appendChild(acts);b.appendChild(md);acts.querySelector('.task-model-btn').addEventListener('click',function(){md.hidden=!md.hidden;this.textContent=md.hidden?'Show the model':'Hide the model'})}
      else b.appendChild(acts);
      var tm=acts.querySelector('.task-timer');if(tm){var iv=null;tm.addEventListener('click',function(){
        if(iv){clearInterval(iv);iv=null;tm.classList.remove('running');tm.querySelector('span').textContent='Start again';return}
        var left=dur;tm.classList.add('running');function tick(){tm.querySelector('span').textContent='Speak now · '+Math.floor(left/60)+':'+('0'+left%60).slice(-2)+' · tap to stop';
          if(left--<=0){clearInterval(iv);iv=null;tm.classList.remove('running');tm.querySelector('span').textContent='Time! Start again';if(window.NLSfx)NLSfx.ok()}}
        tick();iv=setInterval(tick,1000)})}
    });
    /* Top of each part: what you have to do here */
    var NAMES={practice:['practice set','practice sets'],write:['writing task','writing tasks'],speak:['speaking task','speaking tasks'],read:['reading task','reading tasks'],listen:['listening task','listening tasks'],check:['checklist','checklists']};
    panels.forEach(function(pn){var ts=tasks.filter(function(t){return pn.contains(t.card)});if(!ts.length)return;
      var bx=document.createElement('nav');bx.className='p-todo';bx.setAttribute('aria-label','Your tasks in this part');
      bx.innerHTML='<span class="p-todo-k">Your tasks in this part</span><span class="p-todo-l">'+ts.map(function(t,i){return '<button type="button" class="p-todo-i t-'+t.k+'" data-t="'+tasks.indexOf(t)+'">'+ico(t.k)+'<span>'+esc(t.title)+'</span></button>'}).join('')+'</span>';
      var h2=pn.querySelector(':scope > h2');if(h2)h2.parentNode.insertBefore(bx,h2.nextSibling);else pn.insertBefore(bx,pn.firstChild);
      bx.addEventListener('click',function(e){var x=e.target.closest('.p-todo-i');if(!x)return;var c=tasks[+x.getAttribute('data-t')].card;window.scrollTo({top:c.getBoundingClientRect().top+scrollY-130,behavior:'smooth'})})});
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
    var th=document.querySelector('.set-btn');
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

  /* ---------- Unit check: pass 80% to complete the unit and unlock the next ---------- */
  (function(){
    var box=document.getElementById('unit-check');if(!box||!isUnit)return;
    var startB=box.querySelector('.uc-start'),ub=box.querySelector('.uc-body'),h3=box.querySelector('h3'),intro=box.querySelector('.uc-intro');
    var me=avail.map(function(u){return u.code}).indexOf(CODE),nextU=avail[me+1]||null,PASS=80;
    function norm(s){return String(s).toLowerCase().replace(/[’‘`´]/g,"'").replace(/[.,!?;:"“”()]/g,' ').replace(/\s+/g,' ').trim()}
    function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
    function paint(){
      if(P.done[CODE]){box.classList.add('passed');h3.textContent='Unit passed'+(P.score[CODE]!=null?' with '+P.score[CODE]+'%':'');
        intro.innerHTML=nextU?'The next unit is open: <a href="'+UP+nextU.href+'">'+esc(nextU.code+' '+nextU.title)+' &rarr;</a> Its words and rules are now in your <a href="'+UP+'flashcards.html">flashcards</a>.':'You have passed every unit available so far. New units are on the way.';
        startB.querySelector('span').textContent='Retake the unit check';startB.className='btn-sec uc-start'}
    }
    function build(){
      var words=window.NLCards?NLCards.unitCards(CODE).filter(function(c){return c.t==='w'}):[],all=(window.DECK||[]).filter(function(c){return c.t==='w'});
      var ex=shuffle(EXS),N=10,nEx=Math.min(ex.length,words.length>=6?4:N),nW=Math.min(N-nEx,words.length);
      if(nEx+nW<N)nEx=Math.min(ex.length,N-nW);
      var qs=ex.slice(0,nEx).map(function(e){return {k:e.tiles?'tile':'type',e:e}});
      shuffle(words).slice(0,nW).forEach(function(w,i){
        var rev=i%2===1,src=words.length>=4?words:all,opts=[w];
        shuffle(src).forEach(function(o){if(opts.length<4&&norm(rev?o.nl:o.en)!==norm(rev?w.nl:w.en))opts.push(o)});
        qs.push({k:'mc',w:w,rev:rev,opts:shuffle(opts)})});
      return shuffle(qs);
    }
    var qs=[];
    function render(){
      qs=build();
      if(qs.length<3){ub.hidden=false;ub.innerHTML='<p>This unit has no automatic questions. Work through every part, then confirm.</p><button type="button" class="btn-primary uc-confirm">I have finished this unit</button>';
        ub.querySelector('.uc-confirm').onclick=function(){pass(100)};return}
      var h='<ol class="uc-list">';
      qs.forEach(function(q,i){
        h+='<li class="uc-q" data-i="'+i+'">';
        if(q.k==='mc'){h+='<p class="uc-p">'+(q.rev?'How do you say <b>'+esc(q.w.en)+'</b> in Dutch?':'What does <b>'+esc(q.w.nl)+'</b> mean?')+'</p><div class="uc-opts">'
          +q.opts.map(function(o,j){return '<button type="button" class="uc-opt" data-j="'+j+'">'+esc(q.rev?o.nl:o.en)+'</button>'}).join('')+'</div>'}
        else if(q.k==='type'){var inp='<input type="text" class="ex-in uc-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" style="width:'+Math.max(5,Math.min(28,q.e.ans.split('|')[0].length+2))+'ch">';
          h+='<p class="uc-p">'+(window.NLBlanks?NLBlanks.html(q.e.h,q.e.ans,'uc-in'):/_{3,}/.test(q.e.h)?q.e.h.replace(/_{3,}/,inp):q.e.h+' '+inp)+'</p>'}
        else{var t=q.e.tiles.split(' / ').map(function(x){return x.trim()}).filter(Boolean);
          h+='<p class="uc-p">'+q.e.h.replace(/\{\{[^}]+\}\}/,'')+'</p><div class="tl"><div class="tl-line"><span class="tl-ph">Tap the words in the right order. Some words are not needed.</span></div><div class="tl-bank">'+shuffle(window.NLDecoys?t.concat(NLDecoys(t)):t).map(function(x){return '<button type="button" class="tile">'+x+'</button>'}).join('')+'</div></div>'}
        h+='<p class="uc-fb"></p></li>'});
      h+='</ol><div class="uc-foot"><button type="button" class="btn-primary uc-submit">Check my answers</button><span class="uc-res" aria-live="polite"></span></div>';
      ub.innerHTML=h;ub.hidden=false;startB.hidden=true;
      var f=ub.querySelector('.uc-in');if(f)try{f.focus({preventScroll:true})}catch(e){}
    }
    ub.addEventListener('click',function(e){
      var o=e.target.closest('.uc-opt');if(o&&!ub.classList.contains('graded')){o.parentNode.querySelectorAll('.uc-opt').forEach(function(x){x.classList.toggle('on',x===o)});return}
      var t=e.target.closest('.tile');if(t&&!ub.classList.contains('graded')){var tl=t.closest('.tl'),line=tl.querySelector('.tl-line'),bank=tl.querySelector('.tl-bank');(t.parentNode===bank?line:bank).appendChild(t);line.querySelector('.tl-ph').hidden=!!line.querySelector('.tile');return}
      if(e.target.closest('.uc-submit'))grade();
      if(e.target.closest('.uc-retry')){ub.classList.remove('graded');render();box.scrollIntoView({behavior:'smooth',block:'start'})}
    });
    ub.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.classList.contains('uc-in')){e.preventDefault();var all=[].slice.call(ub.querySelectorAll('.uc-in')),n=all[all.indexOf(e.target)+1];if(n)n.focus();else grade()}});
    function grade(){
      var ok=0;
      ub.querySelectorAll('.uc-q').forEach(function(li){var q=qs[+li.getAttribute('data-i')],good=false,right='',fb=li.querySelector('.uc-fb');
        if(q.k==='mc'){var sel=li.querySelector('.uc-opt.on');good=!!sel&&q.opts[+sel.getAttribute('data-j')]===q.w;right=q.rev?q.w.nl:q.w.en;
          li.querySelectorAll('.uc-opt').forEach(function(b){if(q.opts[+b.getAttribute('data-j')]===q.w)b.classList.add('right');b.disabled=true})}
        else if(q.k==='type'){var v=window.NLBlanks?NLBlanks.read(li):li.querySelector('.uc-in').value;good=q.e.ans.split('|').some(function(a){return norm(a)===norm(v)&&norm(v)!==''});right=q.e.ans.split('|')[0];li.querySelectorAll('.uc-in').forEach(function(x){x.readOnly=true})}
        else{var got=[].map.call(li.querySelectorAll('.tl-line .tile'),function(x){return x.textContent}).join(' ');good=norm(got)===norm(q.e.ans)||q.e.ans.split('|').some(function(a){return norm(a)===norm(got)});right=q.e.ans.split('|')[0]}
        li.classList.toggle('ex-ok',good);li.classList.toggle('ex-no',!good);fb.textContent=good?'Correct':'Answer: '+right;if(good)ok++});
      var pct=Math.round(100*ok/qs.length),res=ub.querySelector('.uc-res');ub.classList.add('graded');
      var foot=ub.querySelector('.uc-foot');ub.querySelector('.uc-submit').remove();
      if(window.NLSfx)NLSfx[pct>=PASS?'win':'lose']();
      if(pct>=PASS){res.innerHTML='<b class="ok">'+pct+'%: passed!</b>';pass(pct)}
      else{res.innerHTML='<b class="no">'+pct+'%.</b> You need '+PASS+'%. Look at the answers above, go back over those parts, then try a new set.';
        var r=document.createElement('button');r.type='button';r.className='btn-primary uc-retry';r.textContent='Try a new set';foot.insertBefore(r,res)}
    }
    function pass(pct){
      var first=!P.done[CODE];P.done[CODE]=Date.now();P.score[CODE]=Math.max(pct,P.score[CODE]||0);
      var rec=P.parts[CODE]||{seen:{}};delete rec.locked;parts.forEach(function(p){rec.seen[p.id]=1});P.parts[CODE]=rec;
      save();
      if(LOCKED){location.reload();return}
      renderNav();paint();startB.hidden=false;
      if(first&&nextU){var a=document.createElement('a');a.className='btn-primary uc-next';a.href=UP+nextU.href;a.innerHTML='Go to '+esc(nextU.code)+' &rarr;';ub.querySelector('.uc-foot')?ub.querySelector('.uc-foot').appendChild(a):ub.appendChild(a)}
    }
    startB.addEventListener('click',function(){ub.classList.remove('graded');render()});
    paint();

    /* A locked unit shows a lock screen; learners who already know it can test out with the unit check. */
    if(LOCKED){
      var go=nextUp(),lk=document.createElement('section');lk.className='lockscreen';
      lk.innerHTML='<div class="lk-ico">'+ICON.lock+'</div><h2>This unit is locked</h2><p>Units open one at a time, so each new unit builds on what you already know. '
        +(go?'Pass the unit check of <b>'+esc(go.code+' '+go.title)+'</b> to move forward.':'')+'</p><div class="lk-btns">'
        +(go?'<a class="btn-primary" href="'+UP+go.href+'">Go to '+esc(go.code)+' &rarr;</a>':'')
        +'<button type="button" class="btn-sec lk-test">I already know this: take the unit check</button></div>';
      body.classList.add('is-locked');var main=document.querySelector('.main'),hero=document.querySelector('.hero');
      hero.parentNode.insertBefore(lk,hero.nextSibling);
      lk.querySelector('.lk-test').addEventListener('click',function(){this.remove();lk.appendChild(box);intro.textContent='Score 80% or more to unlock this unit straight away.';startB.click()});
    }
  })();
})();
