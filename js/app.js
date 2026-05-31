'use strict';

/* ══════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════ */

const DISHES = [
  { emoji: '🍝', name: 'Паста' },
  { emoji: '🍕', name: 'Пицца' },
  { emoji: '🍲', name: 'Суп' },
  { emoji: '🥩', name: 'Котлеты' },
  { emoji: '🍱', name: 'Роллы' },
  { emoji: '🥟', name: 'Пельмени' },
];

const SHOPPING_DEFAULT = ['Молоко', 'Хлеб', 'Яйца', 'Помидоры', 'Сыр'];

const TASKS_DEFAULT = [
  { who: 'ali',   text: 'Убрать в комнате' },
  { who: 'aydar', text: 'Помыть посуду' },
  { who: 'ali',   text: 'Сделать уроки' },
  { who: 'aydar', text: 'Вынести мусор' },
  { who: 'all',   text: 'Покормить Хэппи вечером' },
];

const CAT_ITEMS = [
  { emoji: '🍗', label: 'Покормили?' },
  { emoji: '💧', label: 'Вода свежая?' },
  { emoji: '🪮', label: 'Груминг' },
];

const CAT_STATUS_MSGS = [
  '0 из 3 выполнено 😿',
  '1 из 3 — ещё чуть-чуть! 🐾',
  'Почти всё! 🐈',
  'Хэппи доволен! 😸',
];
const CAT_EMOJIS = ['😿', '🐱', '🐈', '😸'];

const WHO_LABELS = { mom: 'Мама', ali: 'Али', aydar: 'Айдар', all: 'Все' };
const DAY_NAMES  = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/* ══════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════ */

const uid  = () => Math.random().toString(36).slice(2, 9);
const esc  = s  => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const dateKey = d => d.toISOString().slice(0, 10);
const todayKey = () => dateKey(new Date());

function getWeekDates() {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function getSampleCalEvents() {
  const wk = getWeekDates();
  const ev = {};
  ev[dateKey(wk[0])] = [
    { time:'08:30', name:'Школа', who:'ali'   },
    { time:'08:30', name:'Школа', who:'aydar' },
    { time:'16:00', name:'⚽ Футбол',  who:'ali' },
  ];
  ev[dateKey(wk[1])] = [
    { time:'08:30', name:'Школа',           who:'ali'   },
    { time:'08:30', name:'Школа',           who:'aydar' },
    { time:'17:30', name:'🎨 Рисование',    who:'aydar' },
  ];
  ev[dateKey(wk[2])] = [
    { time:'08:30', name:'Школа',      who:'ali'   },
    { time:'08:30', name:'Школа',      who:'aydar' },
    { time:'19:00', name:'🧘 Йога',    who:'mom'   },
  ];
  ev[dateKey(wk[3])] = [
    { time:'08:30', name:'Школа', who:'ali'   },
    { time:'08:30', name:'Школа', who:'aydar' },
  ];
  ev[dateKey(wk[4])] = [
    { time:'08:30', name:'Школа',       who:'ali'   },
    { time:'08:30', name:'Школа',       who:'aydar' },
    { time:'19:00', name:'🎬 Кино',     who:'all'   },
  ];
  ev[dateKey(wk[5])] = [
    { time:'12:00', name:'🌳 Пикник в парке', who:'all' },
  ];
  return ev;
}

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */

const S = {
  dinnerVotes:   {},   // dish → count
  dinnerMyVotes: {},   // dish → bool (this-session toggle)
  dinnerCustom:  [],   // string[]

  shopping: [],        // { id, text, done }
  tasks:    [],        // { id, text, who, done }

  cat:     [false, false, false],
  catDate: '',

  calEvents:   {},     // YYYY-MM-DD → Event[]
  outings:     [],     // { id, who, text }
  selectedDay: '',

  load() {
    try {
      this.dinnerVotes   = JSON.parse(localStorage.getItem('family_dinner_votes')  || '{}');
      this.dinnerMyVotes = JSON.parse(localStorage.getItem('family_dinner_my')     || '{}');
      this.dinnerCustom  = JSON.parse(localStorage.getItem('family_dinner_custom') || '[]');

      const sh = JSON.parse(localStorage.getItem('family_shopping') || 'null');
      this.shopping = sh ?? SHOPPING_DEFAULT.map(t => ({ id: uid(), text: t, done: false }));

      const ta = JSON.parse(localStorage.getItem('family_tasks') || 'null');
      this.tasks = ta ?? TASKS_DEFAULT.map(t => ({ id: uid(), ...t, done: false }));

      // Cat — auto-reset each new day
      const catArr  = JSON.parse(localStorage.getItem('family_cat')      || 'null');
      const catDate = localStorage.getItem('family_cat_date') || '';
      const today   = todayKey();
      if (catDate !== today) {
        this.cat = [false, false, false]; this.catDate = today;
      } else {
        this.cat = catArr ?? [false, false, false]; this.catDate = catDate;
      }

      const ce = JSON.parse(localStorage.getItem('family_cal_events') || 'null');
      this.calEvents = ce ?? getSampleCalEvents();

      this.outings = JSON.parse(localStorage.getItem('family_outings') || '[]');

      this.selectedDay = localStorage.getItem('family_selected_day') || todayKey();
    } catch (e) { console.error('State.load', e); }
  },

  save() {
    try {
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
    } catch (e) { console.error('State.save', e); }
  },
};

/* ══════════════════════════════════════════════════
   🍽️ DINNER
══════════════════════════════════════════════════ */

// Module-level dish index — avoids quoting issues in onclick attrs
let _dishIndex = [];

const Dinner = {
  render() {
    this._renderDishes();
    this._renderBars();
  },

  _renderDishes() {
    const presetNames = DISHES.map(d => d.name);
    const emojiMap    = Object.fromEntries(DISHES.map(d => [d.name, d.emoji]));
    _dishIndex        = [...presetNames, ...S.dinnerCustom];

    document.getElementById('dish-grid').innerHTML = _dishIndex.map((name, i) => {
      const active = S.dinnerMyVotes[name] ? 'active' : '';
      const emoji  = emojiMap[name] || '🍴';
      return `<button class="dish-pill ${active}"
        onclick="Dinner.toggleIdx(${i})">${emoji} ${esc(name)}</button>`;
    }).join('');
  },

  _renderBars() {
    const allDishes = [...DISHES.map(d => d.name), ...S.dinnerCustom];
    const voted     = allDishes.filter(n => (S.dinnerVotes[n] || 0) > 0);
    if (!voted.length) { document.getElementById('vote-bars').innerHTML = ''; return; }

    const max = Math.max(1, ...voted.map(n => S.dinnerVotes[n]));
    document.getElementById('vote-bars').innerHTML = voted
      .sort((a, b) => S.dinnerVotes[b] - S.dinnerVotes[a])
      .map(name => {
        const count = S.dinnerVotes[name];
        const pct   = Math.round(count / max * 100);
        return `<div class="vote-bar-row">
          <span class="vote-bar-label">${esc(name)}</span>
          <div class="vote-bar-track"><div class="vote-bar-fill" style="width:${pct}%"></div></div>
          <span class="vote-bar-count">${count}</span>
        </div>`;
      }).join('');
  },

  toggleIdx(i) {
    const name = _dishIndex[i];
    if (name !== undefined) this.toggle(name);
  },

  toggle(name) {
    if (S.dinnerMyVotes[name]) {
      S.dinnerMyVotes[name] = false;
      S.dinnerVotes[name] = Math.max(0, (S.dinnerVotes[name] || 0) - 1);
      if (S.dinnerVotes[name] === 0) delete S.dinnerVotes[name];
    } else {
      S.dinnerMyVotes[name] = true;
      S.dinnerVotes[name]   = (S.dinnerVotes[name] || 0) + 1;
    }
    S.save();
    this.render();
  },

  addCustom() {
    const inp = document.getElementById('dinner-input');
    const val = inp.value.trim();
    if (!val) return;
    const preset = DISHES.map(d => d.name);
    if (!preset.includes(val) && !S.dinnerCustom.includes(val)) {
      S.dinnerCustom.push(val);
    }
    inp.value = '';
    this.toggle(val); // vote immediately
  },

  reset() {
    S.dinnerVotes   = {};
    S.dinnerMyVotes = {};
    S.save();
    this.render();
  },
};

/* ══════════════════════════════════════════════════
   🛒 SHOPPING
══════════════════════════════════════════════════ */

const Shopping = {
  render() {
    const items  = S.shopping;
    const bought = items.filter(i => i.done).length;
    document.getElementById('shopping-badge').textContent = `${bought} куплено`;

    document.getElementById('shopping-list').innerHTML = !items.length
      ? '<li class="no-items">Список пуст 🛒</li>'
      : items.map(item => `
        <li class="check-item ${item.done ? 'done' : ''}"
            onclick="Shopping.toggle('${item.id}')">
          <div class="check-box">${item.done ? '<i class="ti ti-check"></i>' : ''}</div>
          <span class="check-label">${esc(item.text)}</span>
        </li>`).join('');
  },

  toggle(id) {
    const item = S.shopping.find(i => i.id === id);
    if (item) item.done = !item.done;
    S.save(); this.render();
  },

  add() {
    const inp = document.getElementById('shopping-input');
    const val = inp.value.trim();
    if (!val) return;
    S.shopping.push({ id: uid(), text: val, done: false });
    inp.value = '';
    S.save(); this.render();
  },
};

/* ══════════════════════════════════════════════════
   ✅ TASKS
══════════════════════════════════════════════════ */

const Tasks = {
  render() {
    const tasks = S.tasks;
    const done  = tasks.filter(t => t.done).length;
    document.getElementById('tasks-badge').textContent = `${done}/${tasks.length}`;

    document.getElementById('tasks-list').innerHTML = !tasks.length
      ? '<li class="no-items">Заданий нет ✨</li>'
      : tasks.map(t => `
        <li class="check-item task-item ${t.done ? 'done' : ''}"
            onclick="Tasks.toggle('${t.id}')">
          <div class="check-box">${t.done ? '<i class="ti ti-check"></i>' : ''}</div>
          <span class="check-label">${esc(t.text)}</span>
          <span class="who-tag ${t.who}">${WHO_LABELS[t.who] || t.who}</span>
        </li>`).join('');
  },

  toggle(id) {
    const t = S.tasks.find(t => t.id === id);
    if (t) t.done = !t.done;
    S.save(); this.render();
  },

  add() {
    const inp = document.getElementById('task-input');
    const who = document.getElementById('task-who').value;
    const val = inp.value.trim();
    if (!val) return;
    S.tasks.push({ id: uid(), text: val, who, done: false });
    inp.value = '';
    S.save(); this.render();
  },
};

/* ══════════════════════════════════════════════════
   🐱 CAT
══════════════════════════════════════════════════ */

const Cat = {
  render() {
    const count = S.cat.filter(Boolean).length;
    document.getElementById('cat-emoji').textContent  = CAT_EMOJIS[count];
    document.getElementById('cat-status').textContent = CAT_STATUS_MSGS[count];

    document.getElementById('cat-toggles').innerHTML = CAT_ITEMS.map((item, i) => `
      <li class="toggle-item ${S.cat[i] ? 'on' : ''}" onclick="Cat.toggle(${i})">
        <span class="toggle-label">${item.emoji} ${item.label}</span>
        <div class="toggle-switch"><div class="toggle-thumb"></div></div>
      </li>`).join('');
  },

  toggle(i) {
    S.cat[i] = !S.cat[i];
    S.save(); this.render();
  },
};

/* ══════════════════════════════════════════════════
   📅 CALENDAR
══════════════════════════════════════════════════ */

const Cal = {
  weekDates: [],

  init() {
    this.weekDates = getWeekDates();
    if (!S.selectedDay) S.selectedDay = todayKey();
  },

  render() {
    this._renderStrip();
    this._renderEvents();
    this._renderOutings();
  },

  _renderStrip() {
    const today = todayKey();
    document.getElementById('week-strip').innerHTML = this.weekDates.map((d, i) => {
      const key    = dateKey(d);
      const events = S.calEvents[key] || [];
      const whos   = [...new Set(events.map(e => e.who))];
      const dots   = whos.map(w => `<div class="day-dot dot-${w}"></div>`).join('');
      const cls    = [
        key === today ? 'today' : '',
        key === S.selectedDay && key !== today ? 'selected' : '',
      ].filter(Boolean).join(' ');

      return `<button class="day-btn ${cls}" onclick="Cal.selectDay(${JSON.stringify(key)})">
        <span class="day-name">${DAY_NAMES[i]}</span>
        <span class="day-date">${d.getDate()}</span>
        <div class="day-dots">${dots}</div>
      </button>`;
    }).join('');
  },

  _renderEvents() {
    const key    = S.selectedDay;
    const events = S.calEvents[key] || [];
    const d      = new Date(key + 'T00:00:00');
    const label  = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });

    document.getElementById('events-panel').innerHTML = `
      <div class="events-date">${label}</div>
      ${!events.length
        ? '<div class="no-events">Событий нет — свободный день ✨</div>'
        : [...events]
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(e => `
              <div class="event-row">
                <span class="event-time">${esc(e.time)}</span>
                <span class="event-name">${esc(e.name)}</span>
                <span class="who-tag ${e.who}">${WHO_LABELS[e.who] || e.who}</span>
              </div>`).join('')
      }`;
  },

  _renderOutings() {
    document.getElementById('outings-list').innerHTML = !S.outings.length
      ? '<li class="outing-empty">Пока идей нет — напишите первым! ✨</li>'
      : S.outings.map(o => `
        <li class="outing-item">
          <span class="who-tag ${o.who}">${WHO_LABELS[o.who] || o.who}</span>
          <span class="outing-text">${esc(o.text)}</span>
          <button class="btn-remove" onclick="Cal.removeOuting('${o.id}')"
            aria-label="Удалить">×</button>
        </li>`).join('');
  },

  selectDay(key) {
    S.selectedDay = key;
    S.save();
    this._renderStrip();
    this._renderEvents();
  },

  addOuting() {
    const who  = document.getElementById('outing-who').value;
    const inp  = document.getElementById('outing-input');
    const text = inp.value.trim();
    if (!text) return;
    S.outings.push({ id: uid(), who, text });
    inp.value = '';
    S.save();
    this._renderOutings();
  },

  removeOuting(id) {
    S.outings = S.outings.filter(o => o.id !== id);
    S.save();
    this._renderOutings();
  },
};

/* ══════════════════════════════════════════════════
   🌙 THEME
══════════════════════════════════════════════════ */

const Theme = {
  current: 'light',

  init() {
    const saved = localStorage.getItem('family_theme');
    const auto  = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this._apply(saved || auto);
  },

  toggle() {
    this._apply(this.current === 'light' ? 'dark' : 'light');
  },

  _apply(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
    localStorage.setItem('family_theme', theme);
  },
};

/* ══════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  S.load();
  Theme.init();
  Cal.init();

  // Render all blocks
  Dinner.render();
  Shopping.render();
  Tasks.render();
  Cat.render();
  Cal.render();

  // ── Theme toggle
  document.getElementById('theme-toggle')
    .addEventListener('click', () => Theme.toggle());

  // ── Dinner
  document.getElementById('dinner-reset')
    .addEventListener('click', () => Dinner.reset());
  document.getElementById('dinner-add-btn')
    .addEventListener('click', () => Dinner.addCustom());
  document.getElementById('dinner-input')
    .addEventListener('keydown', e => e.key === 'Enter' && Dinner.addCustom());

  // ── Shopping
  document.getElementById('shopping-add-btn')
    .addEventListener('click', () => Shopping.add());
  document.getElementById('shopping-input')
    .addEventListener('keydown', e => e.key === 'Enter' && Shopping.add());

  // ── Tasks
  document.getElementById('task-add-btn')
    .addEventListener('click', () => Tasks.add());
  document.getElementById('task-input')
    .addEventListener('keydown', e => e.key === 'Enter' && Tasks.add());

  // ── Outings
  document.getElementById('outing-add-btn')
    .addEventListener('click', () => Cal.addOuting());
  document.getElementById('outing-input')
    .addEventListener('keydown', e => e.key === 'Enter' && Cal.addOuting());
});
