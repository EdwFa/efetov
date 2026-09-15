const DATA = window.PROTOTYPE_DATA;

const roleLabels = {
  leader: 'Руководитель исследования',
  stationary: 'Врач стационара',
  ambulatory: 'Врач амбулатории'
};

const STORAGE_KEY = 'efetovPrototypeRuntimeV4';
const initialRuntime = {
  patients: JSON.parse(JSON.stringify(DATA.patients)),
  files: JSON.parse(JSON.stringify(DATA.files)),
  audit: JSON.parse(JSON.stringify(DATA.audit))
};
let runtime = loadRuntime();

let state = {
  user: JSON.parse(localStorage.getItem('efetovUser') || 'null'),
  page: localStorage.getItem('efetovPage') || 'journal',
  patientId: runtime.patients[0]?.id || '1',
  activeBlock: 'Общие данные',
  filters: { id:'', code:'', center:'all', operationDate:'', createdAt:'' },
  sort: { key:'id', dir:'asc' },
  auditFilters: { time:'', userId:'', role:'all', action:'', details:'' },
  loginError: ''
};

function loadRuntime(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(saved && Array.isArray(saved.patients) && Array.isArray(saved.files) && Array.isArray(saved.audit)) return saved;
  }catch(e){}
  return JSON.parse(JSON.stringify(initialRuntime));
}
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(runtime)); }
function resetDemoData(){ runtime = JSON.parse(JSON.stringify(initialRuntime)); persist(); state.patientId = runtime.patients[0]?.id || '1'; toast('Демо-данные сброшены'); render(); }

function role(){ return state.user?.role || null; }
function currentUserId(){ return state.user?.id || '—'; }
function currentUserName(){ return state.user?.name || '—'; }
function roleName(){ return roleLabels[role()] || 'Не авторизован'; }
function powers(){
  return {
    isLeader: role()==='leader',
    isStationary: role()==='stationary',
    isAmbulatory: role()==='ambulatory',
    canCreate: role()==='stationary' || role()==='leader',
    canFilesManage: role()==='leader',
    canAudit: role()==='leader',
    canExport: role()==='leader',
    canDeletePatient: role()==='leader'
  };
}

function escapeHtml(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),2600);}
function savePage(){localStorage.setItem('efetovPage', state.page);}
function go(page, patientId){ state.page=page; if(patientId) state.patientId=patientId; savePage(); render(); window.scrollTo({top:0,behavior:'smooth'}); }
function logout(){ localStorage.removeItem('efetovUser'); state.user=null; state.page='journal'; render(); }
function now(){ return new Date().toLocaleString('ru-RU', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}).replace(',', ''); }
function addAudit(action, details){ runtime.audit.unshift({time: now(), userId: currentUserId(), role: roleName(), action, details}); persist(); }

function login(event){
  event.preventDefault();
  const form = event.target;
  const login = form.login.value.trim();
  const password = form.password.value.trim();
  const u = DATA.users.find(x=>x.login===login && x.password===password);
  if(!u){ state.loginError='Неверный логин или пароль. Используйте тестовые учетные записи из карточек ниже.'; render(); return; }
  state.user = {login:u.login, role:u.role, id:u.id, name:u.name};
  localStorage.setItem('efetovUser', JSON.stringify(state.user));
  state.loginError=''; state.page='journal';
  addAudit('Вход в систему', 'Успешная аутентификация');
  render();
}
function quickLogin(login,password){
  const u = DATA.users.find(x=>x.login===login && x.password===password);
  if(u){ state.user={login:u.login, role:u.role, id:u.id, name:u.name}; localStorage.setItem('efetovUser', JSON.stringify(state.user)); state.page='journal'; addAudit('Вход в систему', 'Быстрый вход в демо-прототип'); render(); }
}

function visibleMenu(){
  const p = powers();
  const items = [['journal','Общий журнал пациентов'], ['files','Файловое хранилище']];
  if(p.canAudit) items.push(['audit','Модуль аудита']);
  return items;
}
function canViewBlock(block){
  if(role()==='leader') return true;
  if(role()==='stationary') return ['Общие данные','Анамнез','Предоперационные исследования','Операционные данные'].includes(block);
  if(role()==='ambulatory') return ['Общие данные','Анамнез','Послеоперационные наблюдения'].includes(block);
  return false;
}
function canEditBlock(block){
  if(role()==='leader') return true;
  if(role()==='stationary') return ['Общие данные','Анамнез','Предоперационные исследования','Операционные данные'].includes(block);
  if(role()==='ambulatory') return block==='Послеоперационные наблюдения';
  return false;
}
function patient(){ return runtime.patients.find(p=>p.id===state.patientId) || runtime.patients[0]; }
function filteredPatients(){
  const rows = runtime.patients.filter(p=>{
    const f=state.filters;
    return (!f.id || p.id.toLowerCase().includes(f.id.toLowerCase())) &&
      (!f.code || p.code.toLowerCase().includes(f.code.toLowerCase())) &&
      (f.center==='all' || p.center===f.center) &&
      (!f.operationDate || p.operationDate.toLowerCase().includes(f.operationDate.toLowerCase())) &&
      (!f.createdAt || (p.createdAt||'').toLowerCase().includes(f.createdAt.toLowerCase()));
  });
  const {key, dir} = state.sort || {key:'id', dir:'asc'};
  const factor = dir === 'desc' ? -1 : 1;
  return rows.sort((a,b)=>compareValues(valueForSort(a,key), valueForSort(b,key))*factor);
}
function valueForSort(p,key){
  if(key==='id') return Number(p.id) || p.id || '';
  if(key==='code') return p.code || '';
  if(key==='center') return p.center || '';
  if(key==='operationDate') return normalizeDate(p.operationDate);
  if(key==='createdAt') return normalizeDateTime(p.createdAt);
  if(key==='createdBy') return p.createdByName || p.createdBy || '';
  if(key==='updatedAt') return normalizeDateTime(p.updatedAt);
  return p[key] || '';
}
function compareValues(a,b){
  if(typeof a === 'number' && typeof b === 'number') return a-b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'ru', {numeric:true, sensitivity:'base'});
}
function normalizeDate(v){
  const m=String(v||'').match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v||'');
}
function normalizeDateTime(v){
  const m=String(v||'').match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : String(v||'');
}
function sortBy(key){
  if(state.sort?.key===key){ state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc'; }
  else { state.sort = {key, dir:'asc'}; }
  render();
}
function sortLabel(key){
  if(state.sort?.key!==key) return '↕';
  return state.sort.dir==='asc' ? '↑' : '↓';
}
function sortHeader(label,key){
  return `<button class="sort-btn" onclick="sortBy('${key}')">${label} <span>${sortLabel(key)}</span></button>`;
}
function nextPatientId(){ return String((runtime.patients.map(p=>Number(p.id)).filter(Boolean).sort((a,b)=>b-a)[0] || 0) + 1); }
function nextCode(centerCode='С'){
  const n = String(nextPatientId()).padStart(3,'0');
  return `${centerCode}-2026-${n}`;
}
function centerCode(center){
  if(center.includes('Блохина')) return 'Б';
  if(center.includes('Рыжих')) return 'Р';
  return 'С';
}

function loginView(){
  return `<main class="min-h-screen login-bg p-6 flex items-center justify-center">
    <div class="w-full max-w-5xl grid gap-6 lg:grid-cols-[1fr_1.2fr] items-stretch">
      <section class="card p-8">
        <div class="badge badge-green mb-4">Кликабельный прототип</div>
        <h1 class="text-3xl font-black tracking-tight">Интерактивная цифровая система поддержки клинического испытания</h1>
        <p class="mt-4 muted">Отдельная форма авторизации. Для демонстрации используются три тестовые роли с разным набором прав.</p>
        <form onsubmit="login(event)" class="mt-8 space-y-4">
          <div><label class="label">Логин</label><input name="login" class="input" autocomplete="username" placeholder="manager" /></div>
          <div><label class="label">Пароль</label><input name="password" type="password" class="input" autocomplete="current-password" placeholder="Manager123" /></div>
          ${state.loginError?`<div class="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">${escapeHtml(state.loginError)}</div>`:''}
          <button class="btn btn-primary w-full" type="submit">Войти в систему</button>
        </form>
      </section>
      <section class="grid gap-4">
        ${DATA.users.map(u=>`<div class="card p-5">
          <div class="flex items-start justify-between gap-3">
            <div><div class="text-lg font-black">${roleLabels[u.role]}</div><div class="mt-1 text-sm muted">ID пользователя: ${u.id}</div></div>
            <button class="btn btn-secondary" onclick="quickLogin('${u.login}','${u.password}')">Войти</button>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-slate-50 p-3"><div class="label">Логин</div><code>${u.login}</code></div>
            <div class="rounded-xl bg-slate-50 p-3"><div class="label">Пароль</div><code>${u.password}</code></div>
          </div>
        </div>`).join('')}
      </section>
    </div>
  </main>`;
}

function layout(content){
  return `<div class="min-h-screen flex">
    <aside class="w-72 bg-slate-950 text-white p-5 hidden lg:block">
      <div class="text-xs uppercase tracking-widest text-teal-300 font-black">Sechenov prototype</div>
      <div class="mt-3 text-xl font-black">Клиническое исследование</div>
      <div class="mt-5 rounded-2xl bg-white/8 p-4">
        <div class="text-xs text-slate-400">Текущая роль</div>
        <div class="mt-1 font-black">${roleName()}</div>
        <div class="mt-1 text-xs text-slate-400">${currentUserId()} · ${escapeHtml(state.user?.login || '')}</div>
      </div>
      <nav class="mt-6 space-y-2">
        ${visibleMenu().map(([id,name])=>`<a href="#" onclick="go('${id}');return false" class="navlink ${state.page===id?'active':''}">${name}</a>`).join('')}
      </nav>
      <div class="mt-8 rounded-2xl bg-white/5 p-4 text-xs text-slate-400 leading-5">
        <b class="text-slate-300">Разграничение по ТЗ</b><br/>Врачи видят журнал и хранилище. Модуль аудита и выгрузки доступны только руководителю.
      </div>
    </aside>
    <main class="flex-1 min-w-0">
      <header class="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><div class="text-sm muted">Пользователь: ${currentUserId()}</div><div class="font-black">${roleName()}</div></div>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-secondary lg:hidden" onclick="toast('В мобильной версии меню свернуто. Используйте кнопки переходов в интерфейсе.')">Меню</button>
            <button class="btn btn-secondary" onclick="resetDemoData()">Сбросить демо-данные</button>
            <button class="btn btn-secondary" onclick="toast('Имитация timeout: по ТЗ автоматический выход через 15 минут неактивности')">Timeout 15 мин</button>
            <button class="btn btn-danger" onclick="logout()">Выйти</button>
          </div>
        </div>
      </header>
      <section class="p-5 lg:p-7">${content}</section>
    </main>
  </div>`;
}

function pageTitle(title, desc){return `<div class="mb-6"><h1 class="text-2xl font-black">${title}</h1>${desc?`<p class="mt-2 muted max-w-4xl">${desc}</p>`:''}</div>`;}
function kpi(title,value,note, cls='badge-blue'){return `<div class="card p-4"><div class="text-sm muted">${title}</div><div class="mt-2 text-2xl font-black">${value}</div>${note?`<div class="mt-3"><span class="badge ${cls}">${note}</span></div>`:''}</div>`;}

function journal(){
  const pwr=powers(); const rows=filteredPatients(); const centers=[...new Set(runtime.patients.map(p=>p.center))];
  return layout(`${pageTitle('Общий журнал пациентов','Таблица с ключевыми полями: ID, шифр, группа/центр, дата операции, дата и время создания. Всем ролям доступен просмотр журнала; создание карты пациента — врачу стационара и руководителю.')}
    <div class="card p-4 mb-5">
      <div class="flex flex-col xl:flex-row xl:items-end gap-4">
        <div class="grid-auto flex-1">
          <div><label class="label">ID</label><input class="input" value="${escapeHtml(state.filters.id)}" oninput="state.filters.id=this.value;render()" placeholder="1" /></div>
          <div><label class="label">Шифр</label><input class="input" value="${escapeHtml(state.filters.code)}" oninput="state.filters.code=this.value;render()" placeholder="С-2026-001" /></div>
          <div><label class="label">Группа/центр</label><select class="input" onchange="state.filters.center=this.value;render()"><option value="all">Все центры</option>${centers.map(c=>`<option ${state.filters.center===c?'selected':''} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></div>
          <div><label class="label">Дата операции</label><input class="input" value="${escapeHtml(state.filters.operationDate)}" oninput="state.filters.operationDate=this.value;render()" placeholder="05.10.2022" /></div>
          <div><label class="label">Дата и время создания</label><input class="input" value="${escapeHtml(state.filters.createdAt)}" oninput="state.filters.createdAt=this.value;render()" placeholder="09.06.2026 10:18" /></div>
        </div>
        ${pwr.canExport?`<div class="xl:border-l xl:pl-4 flex flex-wrap xl:flex-col gap-2 xl:min-w-[230px]"><button class="btn btn-export-final" onclick="exportModal('final')">Итоговая выгрузка</button><button class="btn btn-export-slice" onclick="exportModal('slice')">Статистические срезы</button></div>`:''}
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        ${pwr.canCreate?`<button class="btn btn-primary" onclick="go('createPatient')">+ Создать карточку пациента</button>`:`<button class="btn btn-disabled" disabled>+ Создать карточку пациента</button>`}
        <button class="btn btn-secondary" onclick="state.filters={id:'',code:'',center:'all',operationDate:'',createdAt:''};render()">Сбросить фильтры</button>
      </div>
      ${!pwr.canCreate && !pwr.canExport?`<div class="mt-3 text-sm muted">Для текущей роли создание карточки и выгрузки недоступны.</div>`:''}
    </div>
    <div class="card overflow-hidden">
      <table class="table"><thead><tr><th>${sortHeader('ID','id')}</th><th>${sortHeader('Шифр','code')}</th><th>${sortHeader('Группа/центр','center')}</th><th>${sortHeader('Дата операции','operationDate')}</th><th>${sortHeader('Дата и время создания','createdAt')}</th><th>${sortHeader('Автор','createdBy')}</th><th>${sortHeader('Время последнего изменения','updatedAt')}</th><th>Действия</th></tr></thead>
      <tbody>${rows.map(p=>`<tr><td class="font-black">${p.id}</td><td>${p.code}</td><td>${escapeHtml(p.center)}</td><td>${escapeHtml(p.operationDate)}</td><td>${escapeHtml(p.createdAt||'—')}</td><td>${escapeHtml(p.createdByLogin||p.createdByName||p.createdBy)}</td><td>${escapeHtml(p.updatedAt)}</td><td><div class="flex flex-wrap gap-2"><button class="btn btn-secondary" onclick="go('card','${p.id}')">Открыть</button>${pwr.canDeletePatient?`<button class="btn btn-danger" onclick="deletePatient('${p.id}')">Удалить</button>`:`<button class="btn btn-disabled" disabled>Удалить</button>`}</div></td></tr>`).join('')}</tbody></table>
    </div>`);
}
function deletePatient(id){
  if(!powers().canDeletePatient){ toast('Удаление пациента недоступно для текущей роли'); return; }
  const p = runtime.patients.find(x=>x.id===id);
  if(!p) return;
  if(!confirm(`Удалить карточку пациента ${p.code}? Действие будет отражено в демо-аудите.`)) return;
  runtime.patients = runtime.patients.filter(x=>x.id!==id);
  if(state.patientId===id) state.patientId = runtime.patients[0]?.id || '';
  addAudit('Удаление карты пациента', `Удалена карточка ID ${p.id}, шифр ${p.code}`);
  persist(); render(); toast('Карточка удалена из демо-данных');
}

function exportModal(type){
  const label = type==='final' ? 'Итоговая выгрузка' : 'Статистический срез';
  const filterInfo = type==='slice' ? `Выгрузка будет сформирована с учетом выбранных фильтров: ID=${state.filters.id||'все'}, шифр=${state.filters.code||'все'}, центр=${state.filters.center==='all'?'все':state.filters.center}, дата операции=${state.filters.operationDate||'все'}, дата/время создания=${state.filters.createdAt||'все'}.` : 'Выгрузка включает все карточки пациентов без учета фильтров.';
  const fmt = `<div class="fixed inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4" onclick="render()"><div class="card max-w-md w-full p-6" onclick="event.stopPropagation()"><h2 class="text-xl font-black">${label}</h2><p class="mt-2 muted">${escapeHtml(filterInfo)}</p><p class="mt-2 muted">Excel-выгрузка формируется в структуре, соответствующей приложенному шаблону Excel. CSV — дополнительная демо-опция.</p><div class="mt-5 grid grid-cols-2 gap-3"><button class="btn btn-export-final" onclick="performExport('${type}','excel')">Excel</button><button class="btn btn-export-slice" onclick="performExport('${type}','csv')">CSV</button></div><button class="btn btn-secondary w-full mt-3" onclick="render()">Закрыть</button></div></div>`;
  document.getElementById('app').insertAdjacentHTML('beforeend', fmt);
}
function performExport(type, format){
  const rows = type==='slice' ? filteredPatients() : runtime.patients.slice();
  const headers = DATA.exportHeaders && DATA.exportHeaders.length ? DATA.exportHeaders : ['ID','Шифр','Группа/центр','Дата операции','Дата и время создания'];
  const matrix = [headers, ...rows.map(p=>headers.map(h=>valueForExportHeader(p,h)))];
  const name = `${type==='slice'?'stat_slice':'final_export'}_${format==='excel'?'excel':'csv'}`;
  if(format==='excel') downloadExcelLike(matrix, `${name}.xls`);
  else downloadCsv(matrix, `${name}.csv`);
  addAudit('Экспорт', `${type==='slice'?'Статистический срез':'Итоговая выгрузка'} ${format.toUpperCase()}, строк: ${rows.length}`);
  persist(); render(); toast('Выгрузка сформирована и сохранена браузером');
}
function getBlockValue(p, block, fieldNames){
  const items = p.blocks?.[block] || [];
  const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  for(const name of names){
    const found = items.find(f=>String(f.name).toLowerCase().trim()===String(name).toLowerCase().trim() || String(f.name).toLowerCase().includes(String(name).toLowerCase()));
    if(found && found.value!==undefined) return found.value;
  }
  return '';
}
function valueForExportHeader(p, h){
  const header = String(h||'').trim();
  if(!header) return '';
  const low = header.toLowerCase();
  if(low==='фио' || low.includes('телефон') || low.includes('адрес')) return ''; // ПДн не выгружаются в прототипе
  if(low.includes('кто заполнял')) return p.createdByLogin || p.createdBy || '';
  if(low.includes('комментарий')) return `Шифр: ${p.code}; создано: ${p.createdAt}`;
  if(low.includes('пол (м')) return getBlockValue(p,'Общие данные','Пол');
  if(low.includes('возраст')) return getBlockValue(p,'Общие данные','Возраст');
  if(low==='рост') return getBlockValue(p,'Общие данные','Рост');
  if(low==='вес') return getBlockValue(p,'Общие данные','Вес');
  if(low.includes('имт')) return getBlockValue(p,'Общие данные','ИМТ');
  if(low.includes('основное заболевание') || low==='диагноз') return getBlockValue(p,'Общие данные','Диагноз');
  if(low==='стадия' || low.includes('стадия')) return getBlockValue(p,'Общие данные','Стадия');
  if(low.includes('сопутствующие заболевания')) return getBlockValue(p,'Анамнез','Сопутствующие заболевания');
  if(low.includes('чарлсона')) return getBlockValue(p,'Анамнез','Индекс коморбидности Чарлсона');
  if(low==='ecog') return getBlockValue(p,'Анамнез','ECOG');
  if(low.includes('карновского')) return getBlockValue(p,'Анамнез','Карновского');
  if(low.includes('asa')) return getBlockValue(p,'Анамнез','ASA');
  if(low.includes('колоноскопия')) return getBlockValue(p,'Предоперационные исследования','Колоноскопия');
  if(low.includes('кт органов брюшной')) return getBlockValue(p,'Предоперационные исследования','КТ органов брюшной');
  if(low.includes('кт органов грудной')) return getBlockValue(p,'Предоперационные исследования','КТ органов грудной');
  if(low.includes('рэа')) return getBlockValue(p,'Предоперационные исследования','РЭА');
  if(low.includes('са 19')) return getBlockValue(p,'Предоперационные исследования','СА 19');
  if(low.includes('гемоглобин')) return getBlockValue(p,'Предоперационные исследования','Гемоглобин');
  if(low.includes('лейкоциты')) return getBlockValue(p,'Предоперационные исследования','Лейкоциты');
  if(low.includes('креатинин')) return getBlockValue(p,'Предоперационные исследования','Креатинин');
  if(low.includes('дата госпитализации')) return getBlockValue(p,'Операционные данные','Дата госпитализации');
  if(low==='лечащий врач') return getBlockValue(p,'Операционные данные','Лечащий врач');
  if(low.replace(/\s+/g,' ')==='дата операции') return p.operationDate || getBlockValue(p,'Операционные данные','Дата операции');
  if(low==='хирург') return getBlockValue(p,'Операционные данные','Хирург');
  if(low==='ассистенты') return getBlockValue(p,'Операционные данные','Ассистенты');
  if(low.includes('название операции')) return getBlockValue(p,'Операционные данные','Название операции');
  if(low.includes('доступ')) return getBlockValue(p,'Операционные данные','Доступ');
  if(low.includes('кровопотеря')) return getBlockValue(p,'Операционные данные','Кровопотеря');
  if(low.includes('описание опухоли')) return getBlockValue(p,'Операционные данные','Описание опухоли') || getBlockValue(p,'Предоперационные исследования','описание опухоли');
  if(low.includes('интраоперационные осложнения')) return getBlockValue(p,'Операционные данные','Интраоперационные осложнения');
  if(low.includes('количество суток в орит')) return getBlockValue(p,'Послеоперационные наблюдения','Количество суток в ОРИТ');
  if(low.includes('осложнения в послеоперационном')) return getBlockValue(p,'Послеоперационные наблюдения','Осложнения');
  if(low.includes('clavien')) return getBlockValue(p,'Послеоперационные наблюдения','Clavien');
  if(low.includes('дата выписки')) return getBlockValue(p,'Послеоперационные наблюдения','Дата выписки');
  if(low.includes('отслежен')) return getBlockValue(p,'Послеоперационные наблюдения','Отслежен');
  if(low.includes('дата последнего')) return getBlockValue(p,'Послеоперационные наблюдения','Дата последнего');
  if(low.includes('прогрессия')) return getBlockValue(p,'Послеоперационные наблюдения','Прогрессия');
  if(low.includes('местный рецидив')) return getBlockValue(p,'Послеоперационные наблюдения','Местный рецидив');
  return '';
}
function downloadCsv(matrix, filename){
  const csv = '\ufeff' + matrix.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
  downloadBlob(csv, filename, 'text/csv;charset=utf-8');
}
function downloadExcelLike(matrix, filename){
  const html = `<html><head><meta charset="utf-8"><style>td,th{border:1px solid #999;padding:4px;vertical-align:top;mso-number-format:'\\@';}th{font-weight:bold;background:#f2f2f2;}</style></head><body><table>${matrix.map((row,i)=>`<tr>${row.map(v=>i===0?`<th>${escapeHtml(v)}</th>`:`<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
  downloadBlob(html, filename, 'application/vnd.ms-excel;charset=utf-8');
}
function downloadBlob(content, filename, type){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

const createBlocks = {
  'Общие данные': ['Возраст','Диагноз','Пол (М - 1, Ж - 0)','Стадия','Рост','Вес','ИМТ'],
  'Анамнез': ['Сопутствующие заболевания','Индекс коморбидности Чарлсона','ECOG','Шкала Карновского','Риск ASA','Операции в анамнезе'],
  'Предоперационные исследования': ['Колоноскопия: описание опухоли, дата','КТ органов брюшной полости, дата','КТ органов грудной клетки','РЭА, нг/мл','СА 19-9, МЕ/мл','Гемоглобин, г/л','Лейкоциты, *10^9/л','Креатинин, мкмоль/л'],
  'Операционные данные': ['Дата госпитализации','Дата операции','Хирург','Ассистенты','Название операции','Доступ','Кровопотеря','Описание опухоли','Интраоперационные осложнения'],
  'Послеоперационные наблюдения': ['Количество суток в ОРИТ','Осложнения в послеоперационном периоде','Дата выписки','Отслежен (да-1, нет-0)']
};

function createPatient(){
  if(!powers().canCreate) return layout(pageTitle('Создание карточки пациента','Создание карты пациента доступно врачу стационара и руководителю.')); 
  const nextId = nextPatientId();
  const nextCodeDefault = nextCode('С');
  const formBlock = (title, fields)=>`<div class="card p-5"><h2 class="section-title">${title}</h2><div class="mt-4 grid-auto">${fields.map(f=>fieldInput({name:f,value:''}, true, `create-${slug(title)}-${slug(f)}`)).join('')}</div></div>`;
  return layout(`${pageTitle('Создание карточки пациента','Отдельная форма создания. При сохранении карточка добавляется в общий журнал демо-прототипа; фиксируются автор, логин автора и дата/время создания.')}
    <div class="grid-auto mb-5">
      ${kpi('Новый ID', nextId, 'автоматически')}
      ${kpi('Шифр пациента', nextCodeDefault, 'вариант A: ID и шифр отдельно','badge-green')}
      ${kpi('Автор', currentUserId(), 'фиксируется при сохранении')}
      ${kpi('Дата и время', now(), 'фиксируется при сохранении','badge-amber')}
    </div>
    <form id="createPatientForm" onsubmit="saveNewPatient(event)" class="space-y-5">
      <div class="card p-5"><h2 class="section-title">Ключевые поля общего журнала</h2><div class="mt-4 grid-auto">
        <div><label class="label">ID</label><input class="input field-disabled" name="id" value="${nextId}" disabled /></div>
        <div><label class="label">Шифр</label><input class="input" name="code" value="${nextCodeDefault}" /></div>
        <div><label class="label">Группа/центр</label><select class="input" name="center" onchange="document.querySelector('[name=code]').value=nextCode(centerCode(this.value))"><option>Сеченовский университет</option><option>НМИЦ им. Н.Н. Блохина</option><option>НМИЦ колопроктологии им. А.Н. Рыжих</option></select></div>
        <div><label class="label">Дата операции</label><input class="input" name="operationDate" placeholder="дд.мм.гггг" /></div>
      </div></div>
      ${formBlock('1. Общие данные', createBlocks['Общие данные'])}
      ${formBlock('2. Анамнез', createBlocks['Анамнез'])}
      ${formBlock('3. Предоперационные исследования', createBlocks['Предоперационные исследования'])}
      ${formBlock('4. Операционные данные', createBlocks['Операционные данные'])}
      <div class="card p-5 bg-slate-50"><h2 class="section-title">5. Послеоперационные наблюдения</h2><p class="mt-2 muted">Этот блок не заполняется при первичном создании карточки. Блок будет доступен врачу амбулатории и руководителю в карточке пациента.</p></div>
      <div class="flex flex-wrap gap-2"><button class="btn btn-primary" type="submit">Сохранить карточку</button><button class="btn btn-secondary" type="button" onclick="go('journal')">Отмена</button></div>
    </form>`);
}
function slug(s){ return String(s).replace(/[^a-zA-Zа-яА-Я0-9]+/g,'_'); }
function saveNewPatient(event){
  event.preventDefault();
  const form = event.target;
  const id = nextPatientId();
  const center = form.center.value;
  const code = form.code.value.trim() || nextCode(centerCode(center));
  const opDate = form.operationDate.value.trim() || '—';
  const blocks = {};
  for(const [block, fields] of Object.entries(createBlocks)){
    if(block === 'Послеоперационные наблюдения'){
      blocks[block] = createBlocks[block].map(name=>({name, value:''}));
    } else {
      blocks[block] = fields.map(name=>({name, value: document.getElementById(`create-${slug(Object.keys(createBlocks).indexOf(block)+1+'. '+block)}-${slug(name)}`)?.value || ''}));
    }
  }
  const t = now();
  runtime.patients.push({id, code, center, group:center, centerCode:centerCode(center), operationDate:opDate, createdBy:currentUserId(), createdByLogin:state.user?.login || currentUserId(), createdByName:currentUserName(), createdAt:t, updatedAt:t, lock:'нет', blocks});
  addAudit('Создание карты пациента', `Создана карточка ID ${id}, шифр ${code}`);
  persist(); state.patientId=id; state.page='card'; render(); toast('Карточка добавлена в общий журнал');
}

function fieldInput(f, editable, id){
  const val=escapeHtml(f.value ?? ''); const name=escapeHtml(f.name); const long = name.length>58 || val.length>100;
  const idAttr = id ? ` id="${id}"` : '';
  const dataName = ` data-field="${escapeHtml(f.name)}"`;
  return `<div class="${long?'md:col-span-2':''}"><label class="label">${name}</label>${long?`<textarea${idAttr}${dataName} class="input ${editable?'':'field-disabled'}" ${editable?'':'disabled'} rows="3">${val}</textarea>`:`<input${idAttr}${dataName} class="input ${editable?'':'field-disabled'}" ${editable?'':'disabled'} value="${val}" />`}${f.hint?`<div class="help">${escapeHtml(f.hint)}</div>`:''}</div>`;
}

function card(){
  const p=patient();
  if(!p) return layout(pageTitle('Карточка пациента','Нет доступных карточек.'));
  const visibleBlocks = DATA.blockOrder.filter(canViewBlock);
  if(!visibleBlocks.includes(state.activeBlock)) state.activeBlock = visibleBlocks[0] || 'Общие данные';
  const block = state.activeBlock;
  const editable = canEditBlock(block);
  return layout(`${pageTitle('Карточка пациента', 'CRF состоит из 5 блоков. Доступность просмотра и редактирования зависит от роли пользователя.')}
    <div class="grid-auto mb-5">
      ${kpi('ID', p.id, 'ключевое поле журнала')}
      ${kpi('Шифр', p.code, 'код исследования','badge-green')}
      ${kpi('Группа/центр', escapeHtml(p.center), 'ключевое поле журнала')}
      ${kpi('Дата операции', escapeHtml(p.operationDate), 'ключевое поле журнала','badge-amber')}
    </div>
    <div class="card p-4 mb-5">
      <div class="flex flex-wrap gap-2">${DATA.blockOrder.map(b=>canViewBlock(b)?`<button class="btn ${state.activeBlock===b?'btn-primary':'btn-secondary'}" onclick="state.activeBlock='${b}';render()">${b}</button>`:`<button class="btn btn-disabled" disabled>${b}</button>`).join('')}</div>
    </div>
    <div class="card p-5">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-5"><div><h2 class="text-xl font-black">${block}</h2><p class="mt-1 muted">${editable?'Поля доступны для редактирования текущей роли. При сохранении данные реально меняются в демо-прототипе.':'Только просмотр для текущей роли.'}</p></div><span class="badge ${editable?'badge-green':'badge-slate'}">${editable?'редактирование':'только просмотр'}</span></div>
      <div id="patientBlockFields" class="grid-auto">${(p.blocks[block]||[]).map(f=>fieldInput(f, editable)).join('')}</div>
      <div class="mt-5 flex flex-wrap gap-2"><button class="btn btn-primary" ${editable?'':'disabled'} onclick="savePatientBlock()">Сохранить</button><button class="btn btn-secondary" onclick="go('journal')">Назад в журнал</button></div>
    </div>`);
}
function savePatientBlock(){
  const p = patient(); const block = state.activeBlock;
  if(!p || !canEditBlock(block)){ toast('Редактирование блока недоступно'); return; }
  if(role()==='leader' && p.createdBy !== currentUserId()){
    showLeaderEditConfirm(p, block);
    return;
  }
  applyPatientBlockSave(p, block);
}
function creatorLogin(p){
  const fromUsers = DATA.users.find(u=>u.id===p.createdBy)?.login;
  return p.createdByLogin || fromUsers || p.createdBy || p.createdByName || 'неизвестный пользователь';
}
function showLeaderEditConfirm(p, block){
  const login = creatorLogin(p);
  const modal = `<div id="leaderEditModal" class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"><div class="card max-w-lg w-full p-6"><h2 class="text-xl font-black">Подтверждение редактирования</h2><p class="mt-3 text-slate-700">Вы уверены, что хотите внести изменения? Данные о пациенте были внесены другим пользователем – <b>${escapeHtml(login)}</b>.</p><div class="mt-5 flex flex-wrap gap-2 justify-end"><button class="btn btn-secondary" onclick="closeLeaderEditConfirm()">Отмена</button><button class="btn btn-primary" onclick="confirmLeaderEditSave('${p.id}','${block}')">Внести исправления</button></div></div></div>`;
  document.getElementById('app').insertAdjacentHTML('beforeend', modal);
}
function closeLeaderEditConfirm(){ document.getElementById('leaderEditModal')?.remove(); }
function confirmLeaderEditSave(id, block){
  const p = runtime.patients.find(x=>x.id===id);
  closeLeaderEditConfirm();
  if(!p) return;
  applyPatientBlockSave(p, block);
}
function applyPatientBlockSave(p, block){
  const inputs = [...document.querySelectorAll('#patientBlockFields [data-field]')];
  const values = new Map(inputs.map(i=>[i.dataset.field, i.value]));
  p.blocks[block] = (p.blocks[block] || []).map(f=>({...f, value: values.has(f.name) ? values.get(f.name) : f.value}));
  const dateField = p.blocks['Операционные данные']?.find(f=>f.name==='Дата операции');
  if(dateField && dateField.value) p.operationDate = dateField.value;
  p.updatedAt = now();
  addAudit('Редактирование блока', `Пациент ${p.code}: обновлен блок «${block}»`);
  persist(); render(); toast('Изменения сохранены в карточке пациента');
}

function groupFilesByTree(files){
  const root = {};
  files.forEach(file=>{
    const parts = file.folder.split('/').map(x=>x.trim()).filter(Boolean);
    let node = root;
    parts.forEach(part=>{ node[part] = node[part] || {__files:[]}; node = node[part]; });
    node.__files = node.__files || []; node.__files.push(file);
  });
  return root;
}
function renderFileNode(node, level=0){
  return Object.entries(node).filter(([k])=>k!=='__files').map(([folder, child])=>`
    <div class="tree-folder" style="margin-left:${level*16}px">
      <div class="tree-title"><span>📁</span><span>${escapeHtml(folder)}</span></div>
      ${renderFileNode(child, level+1)}
      ${(child.__files||[]).map(f=>renderFileRow(f, level+1)).join('')}
    </div>`).join('');
}
function renderFileRow(f, level){
  const pwr=powers();
  return `<div class="tree-file" style="margin-left:${level*16}px"><div class="min-w-0"><div class="font-bold truncate">📄 ${escapeHtml(f.name)}</div><div class="text-xs muted mt-1">Автор: ${escapeHtml(f.author)} · Дата: ${escapeHtml(f.date)} · Комментарий: ${escapeHtml(f.comment)}</div></div><div class="flex flex-wrap gap-2"><button class="btn btn-secondary" onclick="toast('Скачивание файла — демо-действие')">Скачать</button><button class="btn ${pwr.canFilesManage?'btn-danger':'btn-disabled'}" ${pwr.canFilesManage?'':'disabled'} onclick="deleteFile('${escapeHtml(f.name)}')">Удалить</button></div></div>`;
}
function files(){
  const pwr=powers(); const tree = groupFilesByTree(runtime.files);
  return layout(`${pageTitle('Файловое хранилище','Древовидная структура папок по месяцам и врачам. Руководитель имеет полные права; врачи стационара и амбулатории могут только скачивать файлы.')}
    <div class="mb-5 flex flex-wrap gap-2">
      ${pwr.canFilesManage?`<button class="btn btn-primary" onclick="addDemoFile()">+ Загрузить файл</button><button class="btn btn-secondary" onclick="toast('Создание папки — демо-действие. В прототипе папки появляются вместе с файлами.')">+ Создать папку</button>`:`<button class="btn btn-disabled" disabled>+ Загрузить файл</button><button class="btn btn-disabled" disabled>Удалить файл</button><span class="badge badge-amber">Для вашей роли доступно только скачивание</span>`}
    </div>
    <div class="card p-5"><div class="space-y-3">${renderFileNode(tree)}</div></div>`);
}
function addDemoFile(){
  const month = ['Июнь','Июль','Август'][runtime.files.length % 3];
  const name = `Демо-файл ${runtime.files.length+1}.pdf`;
  runtime.files.push({name, folder:`2026 / ${month} / Руководитель`, author:currentUserId(), date:now().split(' ')[0], comment:'Добавлено в демо-прототипе'});
  addAudit('Загрузка файла', `Загружен файл «${name}»`);
  persist(); render(); toast('Файл добавлен в древовидное хранилище');
}
function deleteFile(name){
  if(!powers().canFilesManage){ toast('Удаление файлов недоступно для текущей роли'); return; }
  runtime.files = runtime.files.filter(f=>f.name!==name);
  addAudit('Удаление файла', `Удален файл «${name}»`);
  persist(); render(); toast('Файл удален из демо-хранилища');
}

function audit(){
  if(!powers().canAudit) return layout(pageTitle('Модуль аудита','Недоступно для текущей роли.'));
  const f=state.auditFilters;
  const rows=runtime.audit.filter(a=>(!f.time||a.time.toLowerCase().includes(f.time.toLowerCase())) && (!f.userId||a.userId.toLowerCase().includes(f.userId.toLowerCase())) && (f.role==='all'||a.role===f.role) && (!f.action||a.action.toLowerCase().includes(f.action.toLowerCase())) && (!f.details||a.details.toLowerCase().includes(f.details.toLowerCase())));
  const roles=[...new Set(runtime.audit.map(a=>a.role))];
  return layout(`${pageTitle('Модуль аудита','Неизменяемый журнал действий. Просмотр доступен только руководителю; записи нельзя удалить или отредактировать через интерфейс.')}
    <div class="card p-4 mb-5"><div class="grid-auto">
      <div><label class="label">Дата и время</label><input class="input" value="${escapeHtml(f.time)}" oninput="state.auditFilters.time=this.value;render()" placeholder="09.06.2026" /></div>
      <div><label class="label">ID пользователя</label><input class="input" value="${escapeHtml(f.userId)}" oninput="state.auditFilters.userId=this.value;render()" placeholder="U-STA-001" /></div>
      <div><label class="label">Роль</label><select class="input" onchange="state.auditFilters.role=this.value;render()"><option value="all">Все</option>${roles.map(r=>`<option ${f.role===r?'selected':''}>${r}</option>`).join('')}</select></div>
      <div><label class="label">Тип действия</label><input class="input" value="${escapeHtml(f.action)}" oninput="state.auditFilters.action=this.value;render()" placeholder="Сохранение формы" /></div>
      <div><label class="label">Детали изменения</label><input class="input" value="${escapeHtml(f.details)}" oninput="state.auditFilters.details=this.value;render()" placeholder="С-2026-001" /></div>
    </div><button class="btn btn-secondary mt-4" onclick="state.auditFilters={time:'',userId:'',role:'all',action:'',details:''};render()">Сбросить фильтры</button></div>
    <div class="card overflow-hidden"><table class="table"><thead><tr><th>Дата и время</th><th>ID пользователя</th><th>Роль</th><th>Тип действия</th><th>Детали изменения</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${escapeHtml(a.time)}</td><td class="font-bold">${escapeHtml(a.userId)}</td><td>${escapeHtml(a.role)}</td><td>${escapeHtml(a.action)}</td><td>${escapeHtml(a.details)}</td></tr>`).join('')}</tbody></table></div>`);
}

function render(){
  const root=document.getElementById('app');
  if(!state.user){ root.innerHTML=loginView(); return; }
  if(state.page==='journal') root.innerHTML=journal();
  else if(state.page==='createPatient') root.innerHTML=createPatient();
  else if(state.page==='card') root.innerHTML=card();
  else if(state.page==='files') root.innerHTML=files();
  else if(state.page==='audit') root.innerHTML=audit();
  else root.innerHTML=journal();
}

document.addEventListener('DOMContentLoaded', render);
