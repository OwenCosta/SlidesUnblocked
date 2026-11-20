/**
 * Slides Unblocked
 * Owned by OwenCosta - https://github.com/OwenCosta/SlidesUnblocked
 *
 * MIT License - Copyright (c) 2026 OwenCosta
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

const DEFAULT_REPO = {
  owner:  'OwenCosta',
  repo:   'SlidesUnblocked',
  branch: 'main',
  path:   ''
};

const FILES = ['Games.html', 'Watch.html', 'Other.html'];
const YT_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

const SEARCH_CLIENTS = [
  { clientName: 'WEB', clientVersion: '2.20241126.01.00', hl: 'en', gl: 'US' },
  { clientName: 'MWEB', clientVersion: '2.20241126.01.00', hl: 'en', gl: 'US' },
  { clientName: 'ANDROID', clientVersion: '19.45.36', androidSdkVersion: 30, hl: 'en', gl: 'US' },
  { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0', hl: 'en', gl: 'US' }
];

const CHUNK = 8000;
const SYNC_MIN = 5;

/* ---------------- safe storage ---------------- */
function props_() {
  try { return PropertiesService.getScriptProperties(); } catch (e) { return null; }
}
function prop_(k) {
  try { const s = props_(); return s ? s.getProperty(k) : null; } catch (e) { return null; }
}
function setProp_(k, v) {
  try { const s = props_(); if (s) s.setProperty(k, v); } catch (e) {}
}
function delProp_(k) {
  try { const s = props_(); if (s) s.deleteProperty(k); } catch (e) {}
}

/* ---------------- channel warm-up ---------------- */
function ping() {
  return 'pong';
}

/* ---------------- page source mode ---------------- */
function pageMode_() {
  return prop_('page_mode') === 'cache' ? 'cache' : 'file';
}

function togglePageMode() {
  const next = pageMode_() === 'cache' ? 'file' : 'cache';
  setProp_('page_mode', next);
  SlidesApp.getUi().alert(
    next === 'cache'
      ? 'Pages now come from the GitHub download.\n\nGitHub edits apply immediately, but the server link can drop out.'
      : 'Pages now come from the script files.\n\nServer link is stable.'
  );
}

/* ---------------- menu ---------------- */
function onOpen() {
  const ui = SlidesApp.getUi();
  ui.createMenu('Slides Unblocked')
    .addItem('Search & play', 'showWatch')
    .addSubMenu(ui.createMenu('Games')
      .addItem('Game hub', 'showGames')
      .addItem('2048', 'show2048')
      .addItem('Snake', 'showSnake')
      .addItem('Breakout', 'showBreakout')
      .addItem('Minesweeper', 'showMines'))
    .addSubMenu(ui.createMenu('Tools').addItem('Open', 'showTools'))
    .addSubMenu(ui.createMenu('Updates')
      .addItem('Sync now', 'menuSync')
      .addItem('Settings', 'menuSettings')
      .addItem('Status', 'menuStatus')
      .addItem('Toggle page source (files / download)', 'togglePageMode')
      .addItem('Reset to default repo', 'menuReset')
      .addItem('Clear downloaded copy', 'menuClear'))
    .addItem('Authorize / diagnose', 'menuDiag')
    .addToUi();
  maybeSync_();
}

/* ---------------- dialogs ---------------- */
function dialog_(file, title, params) {
  maybeSync_();
  let tpl = null;

  if (pageMode_() === 'cache') {
    const cached = cacheGet_(file);
    if (cached) {
      try { tpl = HtmlService.createTemplate(cached); } catch (e) { tpl = null; }
    }
  }
  if (!tpl) tpl = HtmlService.createTemplateFromFile(file);

  Object.assign(tpl, params || {});
  const html = tpl.evaluate()
    .setTitle(title)
    .setWidth(1020)
    .setHeight(780);
  SlidesApp.getUi().showModalDialog(html, title);
}

function showGames()    { dialog_('Games.html', 'Games', { startMode: '2048' }); }
function show2048()     { dialog_('Games.html', '2048', { startMode: '2048' }); }
function showSnake()    { dialog_('Games.html', 'Snake', { startMode: 'snake' }); }
function showBreakout() { dialog_('Games.html', 'Breakout', { startMode: 'breakout' }); }
function showMines()    { dialog_('Games.html', 'Minesweeper', { startMode: 'mines' }); }
function showWatch()    { dialog_('Watch.html', 'Search & play'); }
function showTools()    { dialog_('Other.html', 'Tools', { startTab: 'timer' }); }
function menuSettings() { dialog_('Other.html', 'Settings', { startTab: 'updates' }); }

/* ---------------- settings ---------------- */
function getSettings() {
  return {
    owner:  prop_('gh_owner')  || DEFAULT_REPO.owner,
    repo:   prop_('gh_repo')   || DEFAULT_REPO.repo,
    branch: prop_('gh_branch') || DEFAULT_REPO.branch,
    path:   prop_('gh_path')   || DEFAULT_REPO.path,
    token:  prop_('gh_token')  || '',
    auto:   prop_('gh_auto')   !== 'off',
    isDefault: !prop_('gh_owner') && !prop_('gh_repo'),
    pageMode: pageMode_()
  };
}

function saveSettings(o) {
  setProp_('gh_owner',  (o.owner || DEFAULT_REPO.owner).trim());
  setProp_('gh_repo',   (o.repo || DEFAULT_REPO.repo).trim());
  setProp_('gh_branch', (o.branch || DEFAULT_REPO.branch).trim());
  setProp_('gh_path',   (o.path || '').trim());
  setProp_('gh_token',  (o.token || '').trim());
  setProp_('gh_auto',   o.auto ? 'on' : 'off');
  return getSettings();
}

function resetRepo() {
  ['gh_owner', 'gh_repo', 'gh_branch', 'gh_path', 'gh_token'].forEach(delProp_);
  setProp_('gh_auto', 'on');
  return runSync_();
}

function menuReset() {
  SlidesApp.getUi().alert('Back to OwenCosta/SlidesUnblocked\n\n' + resetRepo().join('\n'));
}

/* ---------------- chunked cache ---------------- */
function cachePut_(key, text) {
  cacheDel_(key);
  const n = Math.max(1, Math.ceil(text.length / CHUNK));
  setProp_(key + ':n', String(n));
  for (let i = 0; i < n; i++) setProp_(key + ':' + i, text.substr(i * CHUNK, CHUNK));
}

function cacheGet_(key) {
  const n = Number(prop_(key + ':n') || 0);
  if (!n) return null;
  let s = '';
  for (let i = 0; i < n; i++) s += prop_(key + ':' + i) || '';
  return s || null;
}

function cacheDel_(key) {
  const n = Number(prop_(key + ':n') || 0);
  for (let i = 0; i < n; i++) delProp_(key + ':' + i);
  delProp_(key + ':n');
}

/* ---------------- github ---------------- */
function fetchFromRepo_(cfg, name) {
  const dir = cfg.path ? cfg.path.replace(/^\/+|\/+$/g, '') + '/' : '';
  if (cfg.token) {
    const url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo +
      '/contents/' + encodeURIComponent(dir + name) + '?ref=' + encodeURIComponent(cfg.branch);
    const r = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github.raw' },
      muteHttpExceptions: true
    });
    return { code: r.getResponseCode(), text: r.getContentText() };
  }
  const url = 'https://raw.githubusercontent.com/' + cfg.owner + '/' + cfg.repo + '/' +
    cfg.branch + '/' + dir + name;
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  return { code: r.getResponseCode(), text: r.getContentText() };
}

function runSync_() {
  const cfg = getSettings();
  const log = [];
  FILES.forEach(function (f) {
    try {
      const res = fetchFromRepo_(cfg, f);
      if (res.code === 200 && res.text.length > 200) {
        cachePut_(f, res.text);
        log.push('OK    ' + f + '  (' + res.text.length + ' bytes)');
      } else {
        log.push('SKIP  ' + f + '  (HTTP ' + res.code + ')');
      }
    } catch (e) {
      log.push('ERR   ' + f + '  ' + e.message);
    }
  });
  setProp_('gh_last', new Date().toISOString());
  setProp_('gh_log', log.join('\n'));
  delProp_('gh_err');
  return log;
}

function maybeSync_() {
  try {
    const cfg = getSettings();
    if (!cfg.auto) return;
    const last = prop_('gh_last');
    if (last && Date.now() - new Date(last).getTime() < SYNC_MIN * 60 * 1000) return;
    runSync_();
  } catch (e) {
    setProp_('gh_err', e.message);
  }
}

function syncNow() {
  try {
    return { ok: true, log: runSync_() };
  } catch (e) {
    return { ok: false, log: [e.message] };
  }
}

function getStatus() {
  const cfg = getSettings();
  const have = FILES.map(function (f) {
    const c = cacheGet_(f);
    return f + ': ' + (c ? c.length + ' bytes cached' : 'bundled copy');
  });
  return {
    repo: cfg.owner + '/' + cfg.repo + '@' + cfg.branch,
    isDefault: cfg.isDefault,
    auto: cfg.auto,
    pageMode: cfg.pageMode,
    last: prop_('gh_last') || 'never',
    err: prop_('gh_err') || '',
    log: prop_('gh_log') || '',
    files: have
  };
}

function menuSync() {
  SlidesApp.getUi().alert('Sync\n\n' + syncNow().log.join('\n'));
}

function menuStatus() {
  const s = getStatus();
  SlidesApp.getUi().alert(
    'Repository: ' + s.repo + (s.isDefault ? '  (default)' : '  (overridden)') +
    '\nAuto-sync: ' + (s.auto ? 'on' : 'off') +
    '\nPage source: ' + (s.pageMode === 'cache' ? 'download' : 'script files') +
    '\nLast sync: ' + s.last +
    (s.err ? '\nLast error: ' + s.err : '') +
    '\n\n' + s.files.join('\n')
  );
}

function menuClear() {
  FILES.forEach(cacheDel_);
  SlidesApp.getUi().alert('Downloaded copy cleared. Bundled files are in use again.');
}

/* ---------------- playback ---------------- */
function vidOf_(x) {
  const m = String(x || '').match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  const t = String(x || '').trim();
  return /^[A-Za-z0-9_-]{11}$/.test(t) ? t : null;
}

/* one reusable slide so the deck never fills up with players */
function playerSlide_() {
  const pres = SlidesApp.getActivePresentation();
  const savedId = prop_('player_slide');

  if (savedId) {
    const hit = pres.getSlides().filter(function (s) {
      return s.getObjectId() === savedId;
    })[0];
    if (hit) return hit;
  }

  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  setProp_('player_slide', slide.getObjectId());

  try {
    slide.getBackground().setSolidFill('#000000');
  } catch (e) {}

  return slide;
}

function playVideo(id, title) {
  if (!id) return { ok: false, msg: 'No video id.' };

  try {
    const pres = SlidesApp.getActivePresentation();
    if (!pres) return { ok: false, msg: 'Open a deck first.' };

    const slide = playerSlide_();
    slide.getVideos().forEach(function (v) { v.remove(); });

    const w = pres.getPageWidth();
    const h = pres.getPageHeight();
    const vw = Math.round(w * 0.92);
    const vh = Math.round(vw * 9 / 16);
    const left = Math.round((w - vw) / 2);
    const top = Math.max(0, Math.round((h - vh) / 2));

    slide.insertVideo('https://www.youtube.com/watch?v=' + id, left, top, vw, vh);
    slide.selectAsCurrentPage();

    /* getSlideNumber() is not available here, so derive it from position */
    const ids = pres.getSlides().map(function (s) { return s.getObjectId(); });
    const n = ids.indexOf(slide.getObjectId()) + 1;

    return { ok: true, n: n > 0 ? n : 0 };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

/* ---------------- diagnostics ---------------- */
function diag() {
  const out = [];

  function probe(name, fn) {
    try {
      const r = fn();
      out.push((r.ok ? 'OK    ' : 'FAIL  ') + name + '  -  ' + r.detail);
    } catch (e) {
      out.push('ERROR ' + name + '  -  ' + e.message);
    }
  }

  probe('page source', function () {
    return { ok: pageMode_() === 'file', detail: pageMode_() === 'file' ? 'script files' : 'download (link may drop)' };
  });

  probe('network / repo access', function () {
    const r = UrlFetchApp.fetch(
      'https://raw.githubusercontent.com/' + DEFAULT_REPO.owner + '/' + DEFAULT_REPO.repo +
      '/' + DEFAULT_REPO.branch + '/Watch.html',
      { muteHttpExceptions: true }
    );
    return { ok: r.getResponseCode() === 200, detail: 'HTTP ' + r.getResponseCode() };
  });

  probe('youtubei search', function () {
    const r = UrlFetchApp.fetch(
      'https://youtubei.googleapis.com/youtubei/v1/search?key=' + YT_KEY,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ context: { client: SEARCH_CLIENTS[0] }, query: 'music' }),
        muteHttpExceptions: true
      }
    );
    const n = (r.getContentText().match(/"videoId"/g) || []).length;
    return { ok: r.getResponseCode() === 200 && n > 0, detail: 'HTTP ' + r.getResponseCode() + ', ' + n + ' hits' };
  });

  probe('youtubei browse', function () {
    const r = UrlFetchApp.fetch(
      'https://youtubei.googleapis.com/youtubei/v1/browse?key=' + YT_KEY,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ context: { client: SEARCH_CLIENTS[0] }, browseId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' }),
        muteHttpExceptions: true
      }
    );
    const n = (r.getContentText().match(/"videoId"/g) || []).length;
    return { ok: r.getResponseCode() === 200 && n > 0, detail: 'HTTP ' + r.getResponseCode() + ', ' + n + ' items' };
  });

  probe('storage', function () {
    setProp_('diag_ping', 'x');
    return { ok: prop_('diag_ping') === 'x', detail: 'read/write ' + (prop_('diag_ping') === 'x' ? 'ok' : 'blocked') };
  });

  probe('search pipeline', function () {
    const r = searchVideos('music');
    return { ok: r.videos.length > 0, detail: r.videos.length + ' videos, ' + r.channels.length + ' channels' };
  });

  probe('player slide', function () {
    const pres = SlidesApp.getActivePresentation();
    if (!pres) return { ok: false, detail: 'no active deck' };
    return { ok: true, detail: pres.getSlides().length + ' slides in deck' };
  });

  return out;
}

function menuDiag() {
  SlidesApp.getUi().alert('Diagnostics\n\n' + diag().join('\n'));
}

/* ---------------- search ---------------- */
function textOf_(n) {
  if (!n) return '';
  if (n.simpleText) return n.simpleText;
  if (n.runs) return n.runs.map(function (r) { return r.text; }).join('');
  return '';
}

function thumbOf_(n) {
  try {
    const t = n && n.thumbnails;
    if (!t || !t.length) return '';
    return t[t.length - 1].url || '';
  } catch (e) { return ''; }
}

function collectVideos_(node, out) {
  if (!node || typeof node !== 'object' || out.length >= 30) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) collectVideos_(node[i], out);
    return;
  }
  if (node.videoId && (node.title || node.headline)) {
    const t = textOf_(node.title) || textOf_(node.headline);
    if (t) {
      out.push({
        id: node.videoId,
        title: t,
        author: textOf_(node.ownerText) || textOf_(node.longBylineText) || textOf_(node.shortBylineText) || '',
        length: (node.lengthText && node.lengthText.simpleText) || '',
        views: textOf_(node.viewCountText) || (node.shortViewCountText && node.shortViewCountText.simpleText) || '',
        age: textOf_(node.publishedTimeText) || ''
      });
      return;
    }
  }
  for (const k in node) {
    const v = node[k];
    if (v && typeof v === 'object') collectVideos_(v, out);
  }
}

function collectChannels_(node, out) {
  if (!node || typeof node !== 'object' || out.length >= 10) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) collectChannels_(node[i], out);
    return;
  }
  const c = node.channelRenderer;
  if (c && c.channelId) {
    out.push({
      id: c.channelId,
      title: textOf_(c.title),
      subs: textOf_(c.subscriberCountText) || textOf_(c.videoCountText) || '',
      avatar: thumbOf_(c.thumbnail)
    });
    return;
  }
  for (const k in node) {
    const v = node[k];
    if (v && typeof v === 'object') collectChannels_(v, out);
  }
}

function innerTube_(q) {
  const videos = [];
  const channels = [];

  for (let i = 0; i < SEARCH_CLIENTS.length; i++) {
    try {
      const r = UrlFetchApp.fetch(
        'https://youtubei.googleapis.com/youtubei/v1/search?key=' + YT_KEY,
        {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ context: { client: SEARCH_CLIENTS[i] }, query: q }),
          muteHttpExceptions: true
        }
      );
      if (r.getResponseCode() !== 200) continue;
      const d = JSON.parse(r.getContentText());
      collectVideos_(d, videos);
      collectChannels_(d, channels);
      if (videos.length || channels.length) break;
    } catch (e) {}
  }

  return { videos: videos, channels: channels };
}

function dedupe_(list, key) {
  const seen = {};
  return list.filter(function (x) {
    const k = x && x[key];
    if (!k || seen[k]) return false;
    seen[k] = 1;
    return true;
  });
}

function searchVideos(q) {
  const r = innerTube_(q);
  return {
    videos: dedupe_(r.videos, 'id').slice(0, 24),
    channels: dedupe_(r.channels, 'id').slice(0, 8)
  };
}

/* uploads for one channel */
function channelVideos(channelId) {
  if (!channelId) return { videos: [], title: '' };

  for (let i = 0; i < SEARCH_CLIENTS.length; i++) {
    try {
      const r = UrlFetchApp.fetch(
        'https://youtubei.googleapis.com/youtubei/v1/browse?key=' + YT_KEY,
        {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ context: { client: SEARCH_CLIENTS[i] }, browseId: channelId }),
          muteHttpExceptions: true
        }
      );
      if (r.getResponseCode() !== 200) continue;
      const d = JSON.parse(r.getContentText());
      const videos = [];
      collectVideos_(d, videos);
      if (videos.length) {
        let title = '';
        try { title = textOf_(d.header.pageHeaderRenderer.title); } catch (e) {}
        return { videos: dedupe_(videos, 'id').slice(0, 24), title: title };
      }
    } catch (e) {}
  }
  return { videos: [], title: '' };
}
