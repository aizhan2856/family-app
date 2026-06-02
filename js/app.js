'use strict';

/* ══════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════ */

const DISHES = [
  { emoji: '🍝', name: 'Паста'    },
  { emoji: '🍕', name: 'Пицца'   },
  { emoji: '🍲', name: 'Суп'     },
  { emoji: '🥩', name: 'Котлеты' },
  { emoji: '🍱', name: 'Роллы'   },
  { emoji: '🥟', name: 'Пельмени'},
];
const PRESET_NAMES = DISHES.map(d => d.name);

const SHOPPING_DEFAULT = ['Молоко', 'Хлеб', 'Яйца', 'Помидоры', 'Сыр'];

const TASKS_DEFAULT = [
  { who:'ali',   text:'Убрать в комнате'       },
  { who:'aydar', text:'Помыть посуду'           },
  { who:'ali',   text:'Сделать уроки'           },
  { who:'aydar', text:'Вынести мусор'           },
  { who:'all',   text:'Покормить Хэппи вечером' },
];

const CAT_ITEMS = [
  { emoji:'🍗', label:'Покормили?'  },
  { emoji:'💧', label:'Вода свежая?'},
  { emoji:'🪮', label:'Груминг'     },
];
const CAT_STATUS_MSGS = [
  '0 из 3 выполнено 😿',
  '1 из 3 — ещё чуть-чуть! 🐾',
  'Почти всё! 🐈',
  'Хэппи доволен! 😸',
];
const CAT_EMOJIS = ['😿','🐱','🐈','😸'];
const WHO_LABELS = { mom:'Мама', ali:'Али', aydar:'Айдар', all:'Все' };
const DAY_NAMES  = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

/* ══════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════ */

const uid     = () => Math.random().toString(36).slice(2,9);
const esc     = s  => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const dateKey = d  => d.toISOString().slice(0,10);
const todayKey= () => dateKey(new Date());

function getWeekDates() {
  const now = new Date(), dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow===0 ? 6 : dow-1));
  mon.setHours(0,0,0,0);
  return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

function getSampleCalEvents() {
  const wk = getWeekDates(), ev = {};
  ev[dateKey(wk[0])] = [{time:'08:30',name:'Школа',who:'ali'},{time:'08:30',name:'Школа',who:'aydar'},{time:'16:00',name:'⚽ Футбол',who:'ali'}];
  ev[dateKey(wk[1])] = [{time:'08:30',name:'Школа',who:'ali'},{time:'08:30',name:'Школа',who:'aydar'},{time:'17:30',name:'🎨 Рисование',who:'aydar'}];
  ev[dateKey(wk[2])] = [{time:'08:30',name:'Школа',who:'ali'},{time:'08:30',name:'Школа',who:'aydar'},{time:'19:00',name:'🧘 Йога',who:'mom'}];
  ev[dateKey(wk[3])] = [{time:'08:30',name:'Школа',who:'ali'},{time:'08:30',name:'Школа',who:'aydar'}];
  ev[dateKey(wk[4])] = [{time:'08:30',name:'Школа',who:'ali'},{time:'08:30',name:'Школа',who:'aydar'},{time:'19:00',name:'🎬 Кино',who:'all'}];
  ev[dateKey(wk[5])] = [{time:'12:00',name:'🌳 Пикник в парке',who:'all'}];
  return ev;
}

/* ══════════════════════════════════════════════════
   STATE  (localStorage persistence)
══════════════════════════════════════════════════ */

const S = {
  dinnerVotes:{}, dinnerMyVotes:{}, dinnerCustom:[],
  shopping:[], tasks:[],
  cat:[false,false,false], catDate:'',
  calEvents:{}, outings:[], selectedDay:'',

  load() {
    try {
      this.dinnerVotes   = JSON.parse(localStorage.getItem('family_dinner_votes')  ||'{}');
      this.dinnerMyVotes = JSON.parse(localStorage.getItem('family_dinner_my')     ||'{}');
      this.dinnerCustom  = JSON.parse(localStorage.getItem('family_dinner_custom') ||'[]');

      const sh = JSON.parse(localStorage.getItem('family_shopping')||'null');
      this.shopping = sh ?? SHOPPING_DEFAULT.map(t=>({id:uid(),text:t,done:false}));

      const ta = JSON.parse(localStorage.getItem('family_tasks')||'null');
      this.tasks = ta ?? TASKS_DEFAULT.map(t=>({id:uid(),...t,done:false}));

      const catArr  = JSON.parse(localStorage.getItem('family_cat')||'null');
      const catDate = localStorage.getItem('family_cat_date')||'';
      const today   = todayKey();
      if (catDate!==today) { this.cat=[false,false,false]; this.catDate=today; }
      else                 { this.cat=catArr??[false,false,false]; this.catDate=catDate; }

      const ce = JSON.parse(localStorage.getItem('family_cal_events')||'null');
      this.calEvents = ce ?? getSampleCalEvents();

      this.outings     = JSON.parse(localStorage.getItem('family_outings')||'[]');
      this.selectedDay = localStorage.getItem('family_selected_day')||todayKey();
    } catch(e){ console.error('load',e); }
  },

  save() {
    try {
      // Всегда сохраняем локально (кеш + myVotes — только для этого устройства)
      localStorage.setItem('family_dinner_votes',  JSON.stringify(this.dinnerVotes));
      localStorage.setItem('family_dinner_my',     JSON.stringify(this.dinnerMyVotes));
      localStorage.setItem('family_dinner_custom', JSON.stringify(this.dinnerCustom));
      localStorage.setItem('family_shopping',      JSON.stringify(this.shopping));
      localStorage.setItem('family_tasks',         JSON.stringify(this.tasks));
      localStorage.setItem('family_cat',           JSON.stringify(this.cat));
      localStorage.setItem('family_cat_date',      this.catDate);
      localStorage.setItem('family_cal_events',    JSON.stringify(this.calEvents));
      localStorage.setItem('family_outings',       JSON.stringify(this.outings));
      localStorage.setItem('family_selected_day',  this.selectedDay);
    } catch(e){ console.error('save',e); }
    GHSync.schedulePush(this);  // синхронизация с облаком
  },
};

/* ══════════════════════════════════════════════════
   ☁️  GITHUB SYNC
   Хранит данные в family-app репозитории.
   Все устройства читают/пишут через GitHub API.
   Токен вводится ОДИН РАЗ и хранится в localStorage.
══════════════════════════════════════════════════ */
const GHSync = {
  REPO: 'aizhan2856/family-app',
  FILE: 'data/family.json',
  KEY:  'family_sync_token',
  _sha: null,
  _writeTimer: null,
  _pollTimer:  null,

  init() {
    // Проверяем invite-ссылку (?s=BASE64_TOKEN)
    try {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('s');
      if (s) {
        const t = atob(s);
        if (t.startsWith('ghp_') || t.startsWith('github_pat_')) {
          localStorage.setItem(this.KEY, t);
          history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch(e) {}

    const token = localStorage.getItem(this.KEY);
    if (!token) { this._showSetup(); return; }
    this._connect(token);
  },

  _connect(token) {
    this._banner('loading', '🔄 Подключение…');
    this._pull(token)
      .then(() => {
        this._banner('on', '☁️ Синхронизировано — все устройства видят одни данные');
        clearInterval(this._pollTimer);
        this._pollTimer = setInterval(() => this._pull(token), 20000);
      })
      .catch(e => {
        console.warn('GHSync connect:', e);
        this._banner('off', '⚠️ Неверный код синхронизации — введите заново');
      });
  },

  async _pull(token) {
    const res = await fetch(
      `https://api.github.com/repos/${this.REPO}/contents/${this.FILE}`,
      { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(res.status);
    const meta = await res.json();
    this._sha = meta.sha;
    const raw  = decodeURIComponent(escape(atob(meta.content.replace(/\n/g,''))));
    const data = JSON.parse(raw);
    this._apply(data);
  },

  schedulePush(state) {
    clearTimeout(this._writeTimer);
    this._writeTimer = setTimeout(() => this._push(state), 1800);
  },

  async _push(state) {
    const token = localStorage.getItem(this.KEY);
    if (!token || !this._sha) return;
    const data = {
      dinnerVotes:  state.dinnerVotes,
      dinnerCustom: state.dinnerCustom,
      shopping:     state.shopping,
      tasks:        state.tasks,
      cat:          state.cat,
      catDate:      state.catDate,
      outings:      state.outings,
      _ts: Date.now(),
    };
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    try {
      const res = await fetch(
        `https://api.github.com/repos/${this.REPO}/contents/${this.FILE}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'family data update', content, sha: this._sha }),
        }
      );
      if (res.ok) {
        const d = await res.json(); this._sha = d.content.sha;
        this._banner('on', '☁️ Синхронизировано');
      } else if (res.status === 409 || res.status === 422) {
        // SHA устарел — перечитываем и повторяем
        await this._pull(token); setTimeout(() => this._push(state), 500);
      }
    } catch(e) { console.warn('GHSync push:', e); }
  },

  _apply(data) {
    if (!data) return;
    const map = {
      dinnerVotes:'dinnerVotes', dinnerCustom:'dinnerCustom',
      shopping:'shopping', tasks:'tasks',
      cat:'cat', catDate:'catDate', outings:'outings',
    };
    Object.entries(map).forEach(([k,v]) => { if (data[k] !== undefined) S[v] = data[k]; });
    Dinner.render(); Shopping.render(); Tasks.render(); Cat.render(); Cal._outings();
  },

  _showSetup() {
    this._banner('off',
      '📱 Данные только на этом устройстве. <a href="#" id="sync-open" style="color:inherit;font-weight:800;text-decoration:underline">Включить синхронизацию →</a>');
    document.getElementById('sync-open')?.addEventListener('click', e => {
      e.preventDefault(); document.getElementById('sync-modal').classList.remove('hidden');
    });
  },

  saveToken() {
    const t = document.getElementById('sync-token-inp').value.trim();
    if (!t) return;
    localStorage.setItem(this.KEY, t);
    document.getElementById('sync-modal').classList.add('hidden');
    clearInterval(this._pollTimer); this._sha = null;
    this._connect(t);
  },

  _banner(type, html) {
    const b = document.getElementById('sync-banner');
    if (!b) return;
    b.innerHTML = html;
    b.className = `sync-banner sync-${type}`;
    // Повторно привязываем клик если есть ссылка
    document.getElementById('sync-open')?.addEventListener('click', e => {
      e.preventDefault(); document.getElementById('sync-modal').classList.remove('hidden');
    });
  },
};

/* ══════════════════════════════════════════════════
   DISH INDEX  (index → name, avoids inline onclick)
══════════════════════════════════════════════════ */
let _dishIndex = [];

/* ══════════════════════════════════════════════════
   🍽️  DINNER
══════════════════════════════════════════════════ */
const Dinner = {
  render() { this._dishes(); this._bars(); },

  _dishes() {
    const emojiMap = Object.fromEntries(DISHES.map(d=>[d.name,d.emoji]));
    _dishIndex = [...PRESET_NAMES, ...S.dinnerCustom];

    document.getElementById('dish-grid').innerHTML = _dishIndex.map((name,i)=>{
      const active   = S.dinnerMyVotes[name] ? 'active' : '';
      const emoji    = emojiMap[name]||'🍴';
      const isCustom = !PRESET_NAMES.includes(name);
      const delBtn   = isCustom
        ? `<button class="btn-del-dish" data-del-dish="${i}" title="Удалить">×</button>`
        : '';
      return `<div class="dish-wrap">
        <button class="dish-pill ${active}" data-dish-idx="${i}">${emoji} ${esc(name)}</button>
        ${delBtn}
      </div>`;
    }).join('');
  },

  _bars() {
    const voted = _dishIndex.filter(n=>(S.dinnerVotes[n]||0)>0);
    if (!voted.length){ document.getElementById('vote-bars').innerHTML=''; return; }
    const max = Math.max(1,...voted.map(n=>S.dinnerVotes[n]));
    document.getElementById('vote-bars').innerHTML = voted
      .sort((a,b)=>S.dinnerVotes[b]-S.dinnerVotes[a])
      .map(name=>{
        const count=S.dinnerVotes[name], pct=Math.round(count/max*100);
        return `<div class="vote-bar-row">
          <span class="vote-bar-label">${esc(name)}</span>
          <div class="vote-bar-track"><div class="vote-bar-fill" style="width:${pct}%"></div></div>
          <span class="vote-bar-count">${count}</span>
        </div>`;
      }).join('');
  },

  toggleIdx(i) {
    const name = _dishIndex[i]; if(!name) return;
    if (S.dinnerMyVotes[name]) {
      S.dinnerMyVotes[name]=false;
      S.dinnerVotes[name]=Math.max(0,(S.dinnerVotes[name]||0)-1);
      if(!S.dinnerVotes[name]) delete S.dinnerVotes[name];
    } else {
      S.dinnerMyVotes[name]=true;
      S.dinnerVotes[name]=(S.dinnerVotes[name]||0)+1;
    }
    S.save(); this.render();
  },

  deleteCustom(i) {
    const name=_dishIndex[i];
    if(!name||PRESET_NAMES.includes(name)) return;
    S.dinnerCustom.splice(S.dinnerCustom.indexOf(name),1);
    delete S.dinnerVotes[name]; delete S.dinnerMyVotes[name];
    S.save(); this.render();
  },

  addCustom() {
    const inp=document.getElementById('dinner-input');
    const val=inp.value.trim(); if(!val) return;
    if(!PRESET_NAMES.includes(val)&&!S.dinnerCustom.includes(val)) S.dinnerCustom.push(val);
    inp.value='';
    // auto-vote
    if(!S.dinnerMyVotes[val]){ S.dinnerMyVotes[val]=true; S.dinnerVotes[val]=(S.dinnerVotes[val]||0)+1; }
    S.save(); this.render();
  },

  reset() { S.dinnerVotes={}; S.dinnerMyVotes={}; S.save(); this.render(); },
};

/* ══════════════════════════════════════════════════
   🛒  SHOPPING
══════════════════════════════════════════════════ */
const Shopping = {
  render() {
    const items=S.shopping, bought=items.filter(i=>i.done).length;
    document.getElementById('shopping-badge').textContent=`${bought} куплено`;
    document.getElementById('shopping-list').innerHTML = !items.length
      ? '<li class="no-items">Список пуст 🛒</li>'
      : items.map(item=>`
        <li class="check-item ${item.done?'done':''}" data-id="${item.id}">
          <div class="check-box">${item.done?'<i class="ti ti-check"></i>':''}</div>
          <span class="check-label">${esc(item.text)}</span>
          <button class="btn-remove" data-del="${item.id}" title="Удалить">×</button>
        </li>`).join('');
  },
  toggle(id){ const it=S.shopping.find(i=>i.id===id); if(it) it.done=!it.done; S.save(); this.render(); },
  delete(id){ S.shopping=S.shopping.filter(i=>i.id!==id); S.save(); this.render(); },
  add(){
    const inp=document.getElementById('shopping-input'), val=inp.value.trim(); if(!val) return;
    S.shopping.push({id:uid(),text:val,done:false}); inp.value=''; S.save(); this.render();
  },
};

/* ══════════════════════════════════════════════════
   ✅  TASKS
══════════════════════════════════════════════════ */
const Tasks = {
  render() {
    const tasks=S.tasks, done=tasks.filter(t=>t.done).length;
    document.getElementById('tasks-badge').textContent=`${done}/${tasks.length}`;
    document.getElementById('tasks-list').innerHTML = !tasks.length
      ? '<li class="no-items">Заданий нет ✨</li>'
      : tasks.map(t=>`
        <li class="check-item task-item ${t.done?'done':''}" data-id="${t.id}">
          <div class="check-box">${t.done?'<i class="ti ti-check"></i>':''}</div>
          <span class="check-label">${esc(t.text)}</span>
          <span class="who-tag ${t.who}">${WHO_LABELS[t.who]||t.who}</span>
          <button class="btn-remove" data-del="${t.id}" title="Удалить">×</button>
        </li>`).join('');
  },
  toggle(id){ const t=S.tasks.find(t=>t.id===id); if(t) t.done=!t.done; S.save(); this.render(); },
  delete(id){ S.tasks=S.tasks.filter(t=>t.id!==id); S.save(); this.render(); },
  add(){
    const inp=document.getElementById('task-input'), who=document.getElementById('task-who').value, val=inp.value.trim();
    if(!val) return;
    S.tasks.push({id:uid(),text:val,who,done:false}); inp.value=''; S.save(); this.render();
  },
};

/* ══════════════════════════════════════════════════
   🐱  CAT
══════════════════════════════════════════════════ */
const Cat = {
  render() {
    const count=S.cat.filter(Boolean).length;
    document.getElementById('cat-emoji').textContent =CAT_EMOJIS[count];
    document.getElementById('cat-status').textContent=CAT_STATUS_MSGS[count];
    document.getElementById('cat-toggles').innerHTML=CAT_ITEMS.map((item,i)=>`
      <li class="toggle-item ${S.cat[i]?'on':''}" data-cat-idx="${i}">
        <span class="toggle-label">${item.emoji} ${item.label}</span>
        <div class="toggle-switch"><div class="toggle-thumb"></div></div>
      </li>`).join('');
  },
  toggle(i){ S.cat[i]=!S.cat[i]; S.save(); this.render(); },
};

/* ══════════════════════════════════════════════════
   📅  CALENDAR
══════════════════════════════════════════════════ */
const Cal = {
  weekDates:[],
  init(){ this.weekDates=getWeekDates(); if(!S.selectedDay) S.selectedDay=todayKey(); },
  render(){ this._strip(); this._events(); this._outings(); },

  _strip() {
    const today=todayKey();
    document.getElementById('week-strip').innerHTML=this.weekDates.map((d,i)=>{
      const key=dateKey(d), events=S.calEvents[key]||[];
      const whos=[...new Set(events.map(e=>e.who))];
      const dots=whos.map(w=>`<div class="day-dot dot-${w}"></div>`).join('');
      const cls=[key===today?'today':'', key===S.selectedDay&&key!==today?'selected':''].filter(Boolean).join(' ');
      return `<button class="day-btn ${cls}" data-day="${key}">
        <span class="day-name">${DAY_NAMES[i]}</span>
        <span class="day-date">${d.getDate()}</span>
        <div class="day-dots">${dots}</div>
      </button>`;
    }).join('');
  },

  _events() {
    const key=S.selectedDay, events=S.calEvents[key]||[];
    const d=new Date(key+'T00:00:00');
    const label=d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'});
    document.getElementById('events-panel').innerHTML=`
      <div class="events-date">${label}</div>
      ${!events.length
        ? '<div class="no-events">Событий нет — свободный день ✨</div>'
        : [...events].sort((a,b)=>a.time.localeCompare(b.time)).map(e=>`
            <div class="event-row">
              <span class="event-time">${esc(e.time)}</span>
              <span class="event-name">${esc(e.name)}</span>
              <span class="who-tag ${e.who}">${WHO_LABELS[e.who]||e.who}</span>
            </div>`).join('')}`;
  },

  _outings() {
    document.getElementById('outings-list').innerHTML=!S.outings.length
      ? '<li class="outing-empty">Пока идей нет — напишите первым! ✨</li>'
      : S.outings.map(o=>`
        <li class="outing-item">
          <span class="who-tag ${o.who}">${WHO_LABELS[o.who]||o.who}</span>
          <span class="outing-text">${esc(o.text)}</span>
          <button class="btn-remove" data-del-outing="${o.id}" title="Удалить">×</button>
        </li>`).join('');
  },

  selectDay(key){ S.selectedDay=key; S.save(); this._strip(); this._events(); },
  addOuting(){
    const who=document.getElementById('outing-who').value;
    const inp=document.getElementById('outing-input'), text=inp.value.trim(); if(!text) return;
    S.outings.push({id:uid(),who,text}); inp.value=''; S.save(); this._outings();
  },
  removeOuting(id){ S.outings=S.outings.filter(o=>o.id!==id); S.save(); this._outings(); },
};

/* ══════════════════════════════════════════════════
   🌙  THEME
══════════════════════════════════════════════════ */
const Theme = {
  current:'light',
  init(){
    const saved=localStorage.getItem('family_theme');
    const auto=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    this._apply(saved||auto);
  },
  toggle(){ this._apply(this.current==='light'?'dark':'light'); },
  _apply(t){
    this.current=t;
    document.documentElement.setAttribute('data-theme',t);
    const ic=document.getElementById('theme-icon');
    if(ic) ic.className=t==='dark'?'ti ti-sun':'ti ti-moon';
    localStorage.setItem('family_theme',t);
  },
};

/* ══════════════════════════════════════════════════
   BOOT  — event delegation replaces ALL inline onclick
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  S.load();       // загружаем из localStorage (мгновенно)
  GHSync.init();  // подключаем GitHub-синхронизацию
  Theme.init();
  Cal.init();

  Dinner.render();
  Shopping.render();
  Tasks.render();
  Cat.render();
  Cal.render();

  /* ── Theme */
  document.getElementById('theme-toggle').addEventListener('click', ()=>Theme.toggle());

  /* ── Dinner: reset + add input */
  document.getElementById('dinner-reset').addEventListener('click',   ()=>Dinner.reset());
  document.getElementById('dinner-add-btn').addEventListener('click', ()=>Dinner.addCustom());
  document.getElementById('dinner-input').addEventListener('keydown', e=>e.key==='Enter'&&Dinner.addCustom());

  /* ── Dinner: dish grid delegation (vote pill + delete custom) */
  document.getElementById('dish-grid').addEventListener('click', e=>{
    const del  = e.target.closest('[data-del-dish]');
    const pill = e.target.closest('[data-dish-idx]');
    if (del)  { e.stopPropagation(); Dinner.deleteCustom(+del.dataset.delDish); return; }
    if (pill) { Dinner.toggleIdx(+pill.dataset.dishIdx); }
  });

  /* ── Shopping: toggle row + delete btn */
  document.getElementById('shopping-list').addEventListener('click', e=>{
    const del = e.target.closest('[data-del]');
    const row = e.target.closest('[data-id]');
    if (del) { e.stopPropagation(); Shopping.delete(del.dataset.del); return; }
    if (row) Shopping.toggle(row.dataset.id);
  });
  document.getElementById('shopping-add-btn').addEventListener('click', ()=>Shopping.add());
  document.getElementById('shopping-input').addEventListener('keydown', e=>e.key==='Enter'&&Shopping.add());

  /* ── Tasks: toggle row + delete btn */
  document.getElementById('tasks-list').addEventListener('click', e=>{
    const del = e.target.closest('[data-del]');
    const row = e.target.closest('[data-id]');
    if (del) { e.stopPropagation(); Tasks.delete(del.dataset.del); return; }
    if (row) Tasks.toggle(row.dataset.id);
  });
  document.getElementById('task-add-btn').addEventListener('click',   ()=>Tasks.add());
  document.getElementById('task-input').addEventListener('keydown',   e=>e.key==='Enter'&&Tasks.add());

  /* ── Cat: toggle switches */
  document.getElementById('cat-toggles').addEventListener('click', e=>{
    const item=e.target.closest('[data-cat-idx]');
    if(item) Cat.toggle(+item.dataset.catIdx);
  });

  /* ── Calendar: week strip */
  document.getElementById('week-strip').addEventListener('click', e=>{
    const btn=e.target.closest('[data-day]');
    if(btn) Cal.selectDay(btn.dataset.day);
  });

  /* ── Outings: add + delete */
  document.getElementById('outings-list').addEventListener('click', e=>{
    const del=e.target.closest('[data-del-outing]');
    if(del) Cal.removeOuting(del.dataset.delOuting);
  });
  document.getElementById('outing-add-btn').addEventListener('click', ()=>Cal.addOuting());
  document.getElementById('outing-input').addEventListener('keydown', e=>e.key==='Enter'&&Cal.addOuting());

  /* ── Sync setup modal */
  const sm = document.getElementById('sync-modal');
  document.getElementById('sync-modal-close')?.addEventListener('click',  ()=>sm.classList.add('hidden'));
  document.getElementById('sync-modal-cancel')?.addEventListener('click', ()=>sm.classList.add('hidden'));
  document.getElementById('sync-modal-save')?.addEventListener('click',   ()=>GHSync.saveToken());
  document.getElementById('sync-token-inp')?.addEventListener('keydown',  e=>e.key==='Enter'&&GHSync.saveToken());
  sm?.addEventListener('click', e=>{ if(e.target===sm) sm.classList.add('hidden'); });
});
