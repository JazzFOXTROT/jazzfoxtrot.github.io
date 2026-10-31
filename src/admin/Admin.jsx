import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { client, REPO, DATA_PATH, UPLOAD_DIR, GitHubError } from './github.js';
import { prepareImage, CARD } from './images.js';

/*
 * Private editor for the "Selected work" section.
 * Anyone can open this page, but changes are saved as a commit to the GitHub repo, so only
 * a token with write access to JazzFOXTROT/jazzfoxtrot.github.io (Kirill's) can change anything.
 */

const SITE = import.meta.env.BASE_URL; // /
const TOKEN_KEY = 'blik-editor-token';
const NEW_TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

const store = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  },
  set(t, remember) {
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
    } catch { /* private mode: token lives in memory only */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

const slugify = s =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 40) || 'work';

const uid = () => Math.random().toString(36).slice(2, 8);
const clone = v => JSON.parse(JSON.stringify(v));
const move = (arr, from, to) => {
  const a = arr.slice();
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
};

const LAYOUTS = [
  { id: 'accordion', label: 'Большие карточки (аккордеон)' },
  { id: 'grid', label: 'Маленькие карточки (сетка)' },
];

/* ---------------------------------------------------------------- sign in */

function SignIn({ onReady, error: initialError }) {
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError || '');

  const submit = async e => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setBusy(true);
    setError('');
    try {
      const me = await client(t).check();
      if (!me.canWrite) throw new Error('Этот ключ может только читать репозиторий. Дай ему право Contents: Read and write.');
      store.set(t, remember);
      onReady(t, me);
    } catch (err) {
      setError(err instanceof GitHubError && err.status === 401 ? 'GitHub не принял ключ. Проверь, что он скопирован целиком и не истёк.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="ed-signin">
      <div className="ed-signin__card">
        <p className="ed-mark serif">blik.</p>
        <h1 className="ed-h1">Редактор работ</h1>
        <p className="ed-muted">
          Здесь меняются работы на сайте. Сохранить что-то можно только ключом GitHub с доступом на запись
          к репозиторию <code>{REPO.owner}/{REPO.repo}</code>. У посетителей сайта такого ключа нет.
        </p>
        <form onSubmit={submit} className="ed-stack">
          <label className="ed-field">
            <span>Ключ GitHub (fine-grained token)</span>
            <input id="token" type="password" autoComplete="off" spellCheck="false" value={token} onChange={e => setToken(e.target.value)} placeholder="github_pat_…" />
          </label>
          <label className="ed-check">
            <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span>Запомнить на этом устройстве</span>
          </label>
          {error && <p className="ed-error" role="alert">{error}</p>}
          <button className="ed-btn ed-btn--primary" disabled={busy || !token.trim()}>{busy ? 'Проверяю…' : 'Войти'}</button>
        </form>
        <details className="ed-help">
          <summary>Как получить ключ (один раз, ~2 минуты)</summary>
          <ol>
            <li>Открой <a href={NEW_TOKEN_URL} target="_blank" rel="noreferrer">GitHub → New fine-grained token ↗</a>.</li>
            <li>Name: <b>Portfolio editor</b>. Expiration: на твой выбор, например 1 год.</li>
            <li>Repository access: <b>Only select repositories</b> → <b>{REPO.repo}</b>.</li>
            <li>Permissions → Repository: <b>Contents: Read and write</b>. По желанию <b>Actions: Read-only</b>, тогда здесь будет видно, когда сайт обновился.</li>
            <li>Generate token, скопируй и вставь сюда. Никому его не отправляй.</li>
          </ol>
        </details>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- image field */

function ImageDrop({ label, hint, src, onFile, busy }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div className="ed-field">
      <span>{label}</span>
      <button
        type="button"
        className={`ed-drop${over ? ' ed-drop--over' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      >
        {src ? <img src={src} alt="" /> : <span className="ed-drop__empty">Перетащи картинку или нажми</span>}
        {busy && <span className="ed-drop__busy">Готовлю…</span>}
      </button>
      {hint && <small className="ed-muted">{hint}</small>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
  );
}

/* ---------------------------------------------------------------- work form */

function WorkForm({ initial, isNew, groups, takenSlugs, srcOf, addUpload, onSave, onClose }) {
  const [w, setW] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const set = patch => setW(v => ({ ...v, ...patch }));
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal?.();
    const onCancel = e => { e.preventDefault(); closeRef.current(); };
    d?.addEventListener('cancel', onCancel);
    return () => d?.removeEventListener('cancel', onCancel);
  }, []);

  const slug = isNew ? slugify(w.slug || w.name) : w.slug;

  const upload = async (file, kind, pageIndex) => {
    setBusy(kind === 'card' ? 'card' : `page-${pageIndex}`);
    setError('');
    try {
      const img = await prepareImage(file, kind);
      const name = kind === 'card' ? 'card' : `page-${pageIndex + 1}`;
      const path = `uploads/${slug}/${name}-${Date.now().toString(36)}.${img.ext}`;
      addUpload(path, img);
      if (kind === 'card') {
        set({ card: path });
        setNote(img.cropped ? `Карточка обрезана по центру до пропорции ${CARD.w}×${CARD.h}.` : '');
      } else {
        setW(v => {
          const pages = v.pages.slice();
          pages[pageIndex] = { ...pages[pageIndex], src: path, w: img.w, h: img.h };
          return { ...v, pages };
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const setPage = (i, patch) => setW(v => ({ ...v, pages: v.pages.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));

  const save = e => {
    e.preventDefault();
    if (!w.name.trim()) return setError('Нужно название.');
    if (isNew && takenSlugs.has(slug)) return setError(`Адрес «${slug}» уже занят другой работой. Поменяй адрес.`);
    if (!w.card) return setError('Нужна картинка карточки.');
    if (w.type === 'case' && !/^(https?:\/\/|\/)/.test(w.url || '')) return setError('Нужна ссылка на кейс: /DeciBuy/case/ или https://…');
    if (w.type === 'pages' && !w.pages.some(p => p.src)) return setError('Добавь хотя бы одну страницу с картинкой.');
    const out = { ...w, slug };
    if (out.type === 'case') delete out.pages;
    else { delete out.url; out.pages = out.pages.filter(p => p.src); }
    onSave(out);
  };

  return (
    <dialog ref={dialog} className="ed-dialog" aria-labelledby="work-form-title">
      <form onSubmit={save} className="ed-form">
        <header className="ed-form__head">
          <h2 id="work-form-title" className="ed-h2">{isNew ? 'Новая работа' : w.name || 'Работа'}</h2>
          <button type="button" className="ed-icon" onClick={onClose} aria-label="Закрыть без сохранения">✕</button>
        </header>

        <div className="ed-form__body">
          <div className="ed-grid2">
            <label className="ed-field">
              <span>Название</span>
              <input id="w-name" value={w.name} onChange={e => set({ name: e.target.value })} placeholder="DeciBuy" required />
            </label>
            <label className="ed-field">
              <span>Адрес страницы</span>
              {isNew ? (
                <input id="w-slug" value={w.slug} onChange={e => set({ slug: e.target.value })} placeholder={slugify(w.name || 'my-work')} />
              ) : (
                <input id="w-slug" value={w.slug} readOnly title="Адрес существующей работы не меняется, чтобы старые ссылки не сломались" />
              )}
              <small className="ed-muted">blik.design/work/{slug}/</small>
            </label>
          </div>

          <label className="ed-field">
            <span>Строка под названием</span>
            <input id="w-line" value={w.cardTitle} onChange={e => set({ cardTitle: e.target.value })} placeholder="Smarter decisions before checkout" />
          </label>
          <label className="ed-field">
            <span>Теги</span>
            <input id="w-tags" value={w.tags} onChange={e => set({ tags: e.target.value })} placeholder="Product design · Research · Prototyping" />
            <small className="ed-muted">Через « · ». Видны на карточке.</small>
          </label>
          <label className="ed-field">
            <span>Описание в шапке страницы работы</span>
            <textarea id="w-about" rows={3} value={w.about} onChange={e => set({ about: e.target.value })} />
          </label>

          <div className="ed-grid2">
            <label className="ed-field">
              <span>Строка (группа)</span>
              <select id="w-group" value={w.group} onChange={e => set({ group: e.target.value })}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.title || 'Без названия'}</option>)}
              </select>
            </label>
            <label className="ed-field">
              <span>Что открывается</span>
              <select id="w-type" value={w.type} onChange={e => set({ type: e.target.value, pages: w.pages?.length ? w.pages : [{ label: 'Home', src: '', w: 0, h: 0, narrow: false }] })}>
                <option value="case">Кейс по ссылке (страница-кейс)</option>
                <option value="pages">Картинки страниц (макеты из Figma)</option>
              </select>
            </label>
          </div>

          <ImageDrop
            label="Карточка"
            hint={`Лучше всего ${CARD.w}×${CARD.h} px или крупнее в той же пропорции. Иначе обрежу по центру.`}
            src={w.card ? srcOf(w.card) : ''}
            busy={busy === 'card'}
            onFile={f => upload(f, 'card')}
          />
          {note && <p className="ed-note">{note}</p>}

          {w.type === 'case' ? (
            <label className="ed-field">
              <span>Ссылка на кейс</span>
              <input id="w-url" type="url" value={w.url || ''} onChange={e => set({ url: e.target.value })} placeholder="/DeciBuy/case/ or https://…" />
              <small className="ed-muted">Открывается внутри сайта под красной шторкой. Кейсы на blik.design (например /DeciBuy/case/) работают лучше всего.</small>
            </label>
          ) : (
            <fieldset className="ed-pages">
              <legend>Страницы</legend>
              {w.pages.map((pg, i) => (
                <div className="ed-page" key={i}>
                  <ImageDrop
                    label={`Страница ${i + 1}`}
                    src={pg.src ? srcOf(pg.src) : ''}
                    busy={busy === `page-${i}`}
                    onFile={f => upload(f, 'page', i)}
                  />
                  <div className="ed-stack">
                    <label className="ed-field">
                      <span>Подпись</span>
                      <input id={`w-page-${i}`} value={pg.label} onChange={e => setPage(i, { label: e.target.value })} placeholder="Home" />
                    </label>
                    <label className="ed-check">
                      <input type="checkbox" checked={!!pg.narrow} onChange={e => setPage(i, { narrow: e.target.checked })} />
                      <span>Мобильный макет (показывать узким)</span>
                    </label>
                    <div className="ed-row">
                      <button type="button" className="ed-btn ed-btn--small" disabled={i === 0} onClick={() => setW(v => ({ ...v, pages: move(v.pages, i, i - 1) }))}>↑</button>
                      <button type="button" className="ed-btn ed-btn--small" disabled={i === w.pages.length - 1} onClick={() => setW(v => ({ ...v, pages: move(v.pages, i, i + 1) }))}>↓</button>
                      <button type="button" className="ed-btn ed-btn--small ed-btn--danger" onClick={() => setW(v => ({ ...v, pages: v.pages.filter((_, j) => j !== i) }))}>Убрать</button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="ed-btn" onClick={() => setW(v => ({ ...v, pages: [...v.pages, { label: '', src: '', w: 0, h: 0, narrow: false }] }))}>+ Страница</button>
            </fieldset>
          )}
          {error && <p className="ed-error" role="alert">{error}</p>}
        </div>

        <footer className="ed-form__foot">
          <button type="button" className="ed-btn" onClick={onClose}>Отмена</button>
          <button className="ed-btn ed-btn--primary" disabled={!!busy}>Готово</button>
        </footer>
      </form>
    </dialog>
  );
}

/* ---------------------------------------------------------------- editor */

function Confirm({ text, yes, onYes, onNo }) {
  return (
    <span className="ed-confirm" role="group">
      <span>{text}</span>
      <button type="button" className="ed-btn ed-btn--small ed-btn--danger" onClick={onYes}>{yes}</button>
      <button type="button" className="ed-btn ed-btn--small" onClick={onNo}>Нет</button>
    </span>
  );
}

export default function Admin() {
  const [token, setToken] = useState(store.get());
  const [me, setMe] = useState(null);
  const [authError, setAuthError] = useState('');
  const [original, setOriginal] = useState(null);
  const [data, setData] = useState(null);
  const [dataSha, setDataSha] = useState('');
  const [uploads, setUploads] = useState({}); // path → { base64, preview }
  const [editing, setEditing] = useState(null); // { work, isNew }
  const [asking, setAsking] = useState(''); // id of the item waiting for a delete confirmation
  const [status, setStatus] = useState(null); // { kind, text, url }
  const [publishing, setPublishing] = useState(false);
  const api = useMemo(() => (token ? client(token) : null), [token]);

  const load = useCallback(async () => {
    const { data: d, sha } = await api.readData();
    setOriginal(d);
    setData(clone(d));
    setDataSha(sha);
    setUploads({});
  }, [api]);

  // Restore a remembered session.
  useEffect(() => {
    if (!api || me) return;
    api.check()
      .then(m => { if (!m.canWrite) throw new Error('read-only'); setMe(m); })
      .catch(() => { store.clear(); setToken(''); setAuthError('Сохранённый ключ больше не работает. Вставь новый.'); });
  }, [api, me]);

  useEffect(() => {
    if (me && api && !data) load().catch(err => setStatus({ kind: 'error', text: `Не удалось загрузить работы: ${err.message}` }));
  }, [me, api, data, load]);

  const dirty = useMemo(() => !!data && JSON.stringify(data) !== JSON.stringify(original), [data, original]);

  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!token || !me) {
    return <SignIn error={authError} onReady={(t, m) => { setToken(t); setMe(m); setAuthError(''); }} />;
  }
  if (!data) {
    return <main className="ed-loading">{status?.text || 'Загружаю работы…'}</main>;
  }

  const srcOf = path => uploads[path]?.preview || `${SITE}assets/${path}`;
  const addUpload = (path, img) => setUploads(u => ({ ...u, [path]: img }));
  const update = fn => setData(d => { const n = clone(d); fn(n); return n; });

  const worksOf = gid => data.projects.map((p, i) => ({ p, i })).filter(x => x.p.group === gid);

  // Moving inside a group swaps with the neighbour of the same group in the flat list.
  const shift = (gid, slug, dir) => update(d => {
    const idx = d.projects.findIndex(p => p.slug === slug);
    const same = d.projects.map((p, i) => ({ p, i })).filter(x => x.p.group === gid).map(x => x.i);
    const pos = same.indexOf(idx);
    const to = same[pos + dir];
    if (to == null) return;
    [d.projects[idx], d.projects[to]] = [d.projects[to], d.projects[idx]];
  });

  const newWork = gid => ({
    slug: '', name: '', card: '', cardTitle: '', tags: '', about: '', type: 'case', url: '',
    group: gid, hidden: false, pages: [{ label: 'Home', src: '', w: 0, h: 0, narrow: false }],
  });

  const saveWork = w => {
    update(d => {
      const i = d.projects.findIndex(p => p.slug === w.slug);
      if (i >= 0) {
        const groupChanged = d.projects[i].group !== w.group;
        d.projects.splice(i, 1);
        if (!groupChanged) { d.projects.splice(i, 0, w); return; }
      }
      // New (or moved to another row): goes to the end of its row.
      let at = d.projects.length;
      for (let k = d.projects.length - 1; k >= 0; k--) if (d.projects[k].group === w.group) { at = k + 1; break; }
      d.projects.splice(at, 0, w);
    });
    setEditing(null);
  };

  const discard = () => { setData(clone(original)); setUploads({}); setStatus(null); };

  const publish = async () => {
    setPublishing(true);
    setStatus({ kind: 'info', text: 'Сохраняю на GitHub…' });
    try {
      const nowSha = await api.dataSha();
      if (nowSha !== dataSha) {
        throw new Error('Работы на GitHub изменились с момента загрузки (например, в другой вкладке). Нажми «Отменить изменения», чтобы загрузить свежую версию.');
      }
      const used = new Set();
      data.projects.forEach(p => { used.add(p.card); p.pages?.forEach(pg => used.add(pg.src)); });
      const was = new Set();
      original.projects.forEach(p => { was.add(p.card); p.pages?.forEach(pg => was.add(pg.src)); });

      const files = [];
      Object.entries(uploads).forEach(([path, img]) => {
        if (used.has(path)) files.push({ path: UPLOAD_DIR + path, base64: img.base64 });
      });
      // Only images uploaded through the editor are ever deleted; the original assets stay.
      was.forEach(path => {
        if (!used.has(path) && path.startsWith('uploads/')) files.push({ path: UPLOAD_DIR + path, remove: true });
      });
      files.push({ path: DATA_PATH, text: `${JSON.stringify(data, null, 2)}\n` });

      const sha = await api.commit(files, 'Update works from the editor');
      const { sha: fresh } = await api.readData().then(r => ({ sha: r.sha }));
      setOriginal(clone(data));
      setDataSha(fresh);
      setUploads({});
      setStatus({ kind: 'ok', text: 'Сохранено. Сайт обновится примерно через 1–2 минуты.', sha });
      watchDeploy(sha);
    } catch (err) {
      setStatus({ kind: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const watchDeploy = sha => {
    let tries = 0;
    const tick = async () => {
      tries += 1;
      try {
        const s = await api.deployStatus(sha);
        if (s.status === 'completed') {
          setStatus(s.conclusion === 'success'
            ? { kind: 'ok', text: 'Готово, сайт обновлён.', link: true }
            : { kind: 'error', text: 'Сборка сайта не прошла. Открой подробности на GitHub.', url: s.url });
          return;
        }
        setStatus(st => (st?.sha === sha ? { ...st, text: 'Сохранено. Сайт собирается…' } : st));
      } catch {
        return; // no Actions permission: keep the "1–2 minutes" message
      }
      if (tries < 60) setTimeout(tick, 5000);
    };
    setTimeout(tick, 4000);
  };

  const signOut = () => { store.clear(); setToken(''); setMe(null); setData(null); setOriginal(null); };

  return (
    <div className="ed">
      <header className="ed-bar">
        <a className="ed-mark serif" href={SITE} target="_blank" rel="noreferrer">blik.</a>
        <span className="ed-bar__title">Редактор работ</span>
        <span className="ed-bar__spacer" />
        <a className="ed-btn ed-btn--ghost" href={`${SITE}#works`} target="_blank" rel="noreferrer">Открыть сайт ↗</a>
        <button type="button" className="ed-btn ed-btn--ghost" onClick={signOut}>Выйти</button>
      </header>

      <div className={`ed-save${dirty ? ' ed-save--dirty' : ''}`} role="status">
        <span className={`ed-save__text ed-save__text--${status?.kind || 'idle'}`}>
          {status?.text || (dirty ? 'Есть несохранённые изменения. На сайте они появятся после «Сохранить на сайт».' : 'Всё сохранено. Так сайт выглядит сейчас.')}
          {status?.url && <> <a href={status.url} target="_blank" rel="noreferrer">Подробности ↗</a></>}
          {status?.link && <> <a href={`${SITE}#works`} target="_blank" rel="noreferrer">Посмотреть ↗</a></>}
        </span>
        <span className="ed-row">
          <button type="button" className="ed-btn" disabled={!dirty || publishing} onClick={discard}>Отменить изменения</button>
          <button type="button" className="ed-btn ed-btn--primary" disabled={!dirty || publishing} onClick={publish}>{publishing ? 'Сохраняю…' : 'Сохранить на сайт'}</button>
        </span>
      </div>

      <main className="ed-main">
        <p className="ed-muted ed-lead">
          Порядок здесь = порядок на сайте: первая работа в строке стоит первой. Первая строка — это заголовок секции со штрихкодом.
        </p>

        {data.groups.map((g, gi) => {
          const list = worksOf(g.id);
          return (
            <section className="ed-group" key={g.id} aria-label={g.title || 'Строка без названия'}>
              <div className="ed-group__head">
                <span className="ed-group__n">{gi === 0 ? 'Строка 1 · заголовок секции' : `Строка ${gi + 1}`}</span>
                <span className="ed-row">
                  <button type="button" className="ed-btn ed-btn--small" disabled={gi === 0} onClick={() => update(d => { d.groups = move(d.groups, gi, gi - 1); })} aria-label="Поднять строку">↑</button>
                  <button type="button" className="ed-btn ed-btn--small" disabled={gi === data.groups.length - 1} onClick={() => update(d => { d.groups = move(d.groups, gi, gi + 1); })} aria-label="Опустить строку">↓</button>
                  {asking === `g-${g.id}` ? (
                    <Confirm text="Удалить строку?" yes="Удалить" onYes={() => { update(d => { d.groups.splice(gi, 1); }); setAsking(''); }} onNo={() => setAsking('')} />
                  ) : (
                    <button
                      type="button"
                      className="ed-btn ed-btn--small ed-btn--danger"
                      disabled={list.length > 0 || data.groups.length === 1}
                      title={list.length ? 'Сначала перенеси или удали работы из этой строки' : ''}
                      onClick={() => setAsking(`g-${g.id}`)}
                    >
                      Удалить строку
                    </button>
                  )}
                </span>
              </div>
              <div className="ed-grid2">
                <label className="ed-field">
                  <span>Заголовок</span>
                  <input id={`g-title-${g.id}`} className="serif ed-title-input" value={g.title} onChange={e => update(d => { d.groups[gi].title = e.target.value; })} />
                </label>
                <label className="ed-field">
                  <span>Вид</span>
                  <select id={`g-layout-${g.id}`} value={g.layout} onChange={e => update(d => { d.groups[gi].layout = e.target.value; })}>
                    {LAYOUTS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="ed-field">
                <span>Описание</span>
                <textarea id={`g-lines-${g.id}`} rows={2} value={g.lines} onChange={e => update(d => { d.groups[gi].lines = e.target.value; })} />
              </label>

              <ul className="ed-works" role="list">
                {list.map(({ p }, k) => (
                  <li key={p.slug} className={`ed-work${p.hidden ? ' ed-work--hidden' : ''}`}>
                    <span className="ed-work__n">{k + 1}</span>
                    <img className="ed-work__img" src={srcOf(p.card)} alt="" />
                    <span className="ed-work__text">
                      <span className="ed-work__name serif">{p.name}</span>
                      <span className="ed-muted">{p.cardTitle || p.tags}</span>
                      <span className="ed-tags">
                        <span className="ed-tag">{p.type === 'case' ? 'Кейс по ссылке' : `Страниц: ${p.pages?.length || 0}`}</span>
                        {p.hidden && <span className="ed-tag ed-tag--hidden">Скрыта</span>}
                      </span>
                    </span>
                    <span className="ed-work__actions">
                      <button type="button" className="ed-btn ed-btn--small" disabled={k === 0} onClick={() => shift(g.id, p.slug, -1)} aria-label={`Поднять ${p.name}`}>↑</button>
                      <button type="button" className="ed-btn ed-btn--small" disabled={k === list.length - 1} onClick={() => shift(g.id, p.slug, 1)} aria-label={`Опустить ${p.name}`}>↓</button>
                      <button type="button" className="ed-btn ed-btn--small" onClick={() => setEditing({ work: clone({ pages: [], ...p }), isNew: false })}>Изменить</button>
                      <button type="button" className="ed-btn ed-btn--small" onClick={() => update(d => { const x = d.projects.find(q => q.slug === p.slug); x.hidden = !x.hidden; })}>{p.hidden ? 'Показать' : 'Скрыть'}</button>
                      {asking === p.slug ? (
                        <Confirm text="Удалить работу?" yes="Удалить" onYes={() => { update(d => { d.projects = d.projects.filter(q => q.slug !== p.slug); }); setAsking(''); }} onNo={() => setAsking('')} />
                      ) : (
                        <button type="button" className="ed-btn ed-btn--small ed-btn--danger" onClick={() => setAsking(p.slug)}>Удалить</button>
                      )}
                    </span>
                  </li>
                ))}
                {!list.length && <li className="ed-empty">В этой строке пока нет работ. На сайте пустая строка не показывается.</li>}
              </ul>
              <button type="button" className="ed-btn" onClick={() => setEditing({ work: newWork(g.id), isNew: true })}>+ Добавить работу</button>
            </section>
          );
        })}

        <button
          type="button"
          className="ed-btn ed-add-row"
          onClick={() => update(d => { d.groups.push({ id: `row-${uid()}`, title: 'New row', lines: '', layout: 'grid' }); })}
        >
          + Добавить строку
        </button>
      </main>

      {editing && (
        <WorkForm
          initial={editing.work}
          isNew={editing.isNew}
          groups={data.groups}
          takenSlugs={new Set(data.projects.map(p => p.slug))}
          srcOf={srcOf}
          addUpload={addUpload}
          onSave={saveWork}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
