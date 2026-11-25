/* 易搭 · 广场 (Plaza) — 图文穿搭分享社区
 * 依赖: window.AW (escape/toast), window.AW_DATA。经典脚本，无 ESM，file:// 与 WebView 可用。
 * 数据独立于主状态库，存 IndexedDB: yida-plaza-v1 / store: posts。
 * 对外接口: window.YidaPlaza = { render(), bind(root), notify(name), seedIfEmpty() }
 */
(function () {
  'use strict';
  var AW = window.AW || {};
  var esc = AW.escape || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var toast = AW.toast || function (m) { console.log('[plaza]', m); };

  var DB_NAME = 'yida-plaza-v1', STORE = 'posts', KEY = 'state';
  var db = null;
  var state = { posts: [], liked: {}, faved: {}, comments: {}, following: {}, seeded: false };
  var ui = { tab: 'recommend', expanded: {}, composing: false, draftText: '', draftImages: [], draftTag: '', profileTab: 'posts' };
  var profileAuthor = null; // null = 当前不在个人主页；否则为正在查看的作者名
  var uid = function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); };

  /* ---------- storage ---------- */
  function openDB() {
    return new Promise(function (resolve, reject) {
      if (db) return resolve(db);
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
      r.onsuccess = function () { db = r.result; db.onversionchange = function () { db.close(); db = null; }; resolve(db); };
      r.onerror = function () { reject(r.error); };
    });
  }
  function load() {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        var r = d.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }
  function save() {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(state, KEY);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  /* ---------- seed data ---------- */
  function seedPosts() {
    var now = Date.now(), H = 3600e3, D = 86400e3;
    var me = (window.YidaProduct && YidaProduct.state && YidaProduct.state.name) || '穿搭旅人';
    return [
      { id: 'seed_1', author: '晚风穿搭日记', handle: '@wanfeng', avatar: '晚', avatarColor: '#8E74BE',
        time: now - 2 * H, text: '秋天的第一套通勤穿搭！米白针织＋橄榄绿半裙，温温柔柔又不失气场。今天也是认真生活的一天 ✨ 大家觉得这个配色适合约会吗？',
        images: ['assets/demo-clothes/ai_outfit_model.png', 'assets/items/cut/w0007.png', 'assets/items/cut/w0011.png'],
        tag: '通勤穿搭', likes: 128, reposts: 12, mine: false },
      { id: 'seed_2', author: '小橘的衣橱', handle: '@orange_closet', avatar: '橘', avatarColor: '#D85A30',
        time: now - 6 * H, text: '把塔罗抽到的「节制」穿在身上是什么体验？深空色系＋一点金色点缀，神秘又日常。分享给同样喜欢玄学穿搭的姐妹们～',
        images: ['assets/demo-clothes/ai_outfit_dark.png'],
        tag: '今日OOTD', likes: 86, reposts: 5, mine: false },
      { id: 'seed_3', author: '梨形自救指南', handle: '@pearstyle', avatar: '梨', avatarColor: '#1D9E75',
        time: now - 1 * D - 3 * H, text: '梨形身材真实穿搭分享：高腰A字裙真的yyds！遮胯显腰，配上简约白上衣清爽又显高。同款不同色都好看，求轻拍～',
        images: ['assets/items/cut/w0008.png', 'assets/items/cut/w0009.png', 'assets/items/cut/w0010.png', 'assets/items/cut/aw01.png'],
        tag: '梨形穿搭', likes: 233, reposts: 41, mine: false },
      { id: 'seed_4', author: me, handle: '@me', avatar: me.slice(0, 1), avatarColor: '#7357D9',
        time: now - 2 * D, text: '用易搭抽签搭的这套，居然意外好看！记录一下今天的灵感 ✦',
        images: ['assets/demo-clothes/ai_outfit_model.png', 'assets/items/cut/aw05.png'],
        tag: '穿搭记录', likes: 24, reposts: 2, mine: true }
    ];
  }

  function init() {
    return load().then(function (stored) {
      if (stored && typeof stored === 'object' && Array.isArray(stored.posts)) {
        state = Object.assign({}, state, stored);
      } else {
        state.posts = seedPosts();
        state.seeded = true;
        return save();
      }
    }).catch(function (e) {
      // file:// 下 IndexedDB 可能被禁；退化为内存态，仍可浏览样例
      console.warn('[plaza] storage unavailable, using memory state', e);
      state.posts = seedPosts();
    });
  }

  /* ---------- helpers ---------- */
  function timeAgo(t) {
    var d = Date.now() - t, m = Math.floor(d / 60000), h = Math.floor(d / 3600e3), day = Math.floor(d / 86400e3);
    if (m < 1) return '刚刚';
    if (m < 60) return m + '分钟前';
    if (h < 24) return h + '小时前';
    if (day < 30) return day + '天前';
    var dt = new Date(t); return (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
  }
  function likeCount(p) { return (p.likes || 0) + (state.liked[p.id] ? 1 : 0); }
  function commentCount(p) { return (p.comments || 0) + ((state.comments[p.id] || []).length); }
  function favCount(p) { return (p.faves || 0) + (state.faved[p.id] ? 1 : 0); }
  function myName() { return (window.YidaProduct && YidaProduct.state && YidaProduct.state.name) || '穿搭旅人'; }

  /* ---------- profile helpers (供个人主页与「我的」页统计共用) ---------- */
  function postsBy(author) { return state.posts.filter(function (p) { return p.author === author; }); }
  function avatarOf(author) {
    if (author === myName()) return { letter: myName().slice(0, 1), color: '#7357D9', handle: '@me' };
    var p = postsBy(author)[0];
    return p ? { letter: p.avatar || author.slice(0, 1), color: p.avatarColor || '#888780', handle: p.handle || '' }
             : { letter: author.slice(0, 1), color: '#888780', handle: '' };
  }
  // 我的统计：发布数、获赞数（我发的帖子收到的赞）、收藏数、关注数
  function myStats() {
    var mine = postsBy(myName());
    var likes = mine.reduce(function (s, p) { return s + likeCount(p); }, 0);
    var comments = mine.reduce(function (s, p) { return s + commentCount(p); }, 0);
    return { posts: mine.length, likes: likes, comments: comments,
      faved: Object.keys(state.faved).length, following: Object.keys(state.following).length };
  }
  function setProfile(author) { profileAuthor = author || null; ui.profileTab = 'posts'; ui.expanded = {}; }

  function icons() {
    return {
      back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>',
      repost: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 2l4 4-4 4"/><path d="M3 12V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v3a3 3 0 01-3 3H3"/></svg>',
      comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 01-8.5 8.3 9 9 0 01-4-.9L3 21l1.9-5.2A8.3 8.3 0 013 11.5 8.4 8.4 0 0111.5 3 8.4 8.4 0 0121 11.5z"/></svg>',
      like: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 000-7.8z"/></svg>',
      fav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
      more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
      image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
    };
  }
  var IC = icons();

  function imageGrid(images) {
    if (!images || !images.length) return '';
    var n = images.length, cls = 'g' + Math.min(n, 9);
    var html = images.slice(0, 9).map(function (src) {
      return '<figure class="pl-grid-item"><img loading="lazy" decoding="async" src="' + esc(src) + '" alt="穿搭图片" data-pl-zoom="' + esc(src) + '"></figure>';
    }).join('');
    return '<div class="pl-grid ' + cls + '">' + html + '</div>';
  }

  function commentBlock(p) {
    var list = state.comments[p.id] || [], open = !!ui.expanded[p.id];
    var items = list.map(function (c) {
      return '<div class="pl-cmt"><span class="pl-cmt-avatar" style="background:' + esc(c.color || '#888780') + '">' + esc((c.author || '友').slice(0, 1)) + '</span><div class="pl-cmt-body"><b>' + esc(c.author) + '</b><p>' + esc(c.text) + '</p><small>' + timeAgo(c.time) + '</small></div></div>';
    }).join('');
    return '<div class="pl-comments' + (open ? ' open' : '') + '">' +
      '<div class="pl-cmt-list">' + (items || '<p class="pl-cmt-empty">还没有评论，来说点什么吧～</p>') + '</div>' +
      (open ? '<div class="pl-cmt-form"><input type="text" class="pl-cmt-input" maxlength="200" placeholder="写下你的评论…" data-cmt-input="' + esc(p.id) + '"><button class="pl-cmt-send" data-cmt-send="' + esc(p.id) + '">发送</button></div>' : '') +
      '</div>';
  }

  function postCard(p) {
    var liked = !!state.liked[p.id], faved = !!state.faved[p.id];
    var followed = !!state.following[p.author];
    return '<article class="pl-post" data-post="' + esc(p.id) + '">' +
      '<div class="pl-post-head">' +
        '<button type="button" class="pl-avatar pl-profile-link" style="background:' + esc(p.avatarColor || '#888780') + '" data-pl-profile="' + esc(p.author) + '" aria-label="查看 ' + esc(p.author) + ' 的主页">' + esc(p.avatar || '友') + '</button>' +
        '<div class="pl-post-user"><button type="button" class="pl-user-link" data-pl-profile="' + esc(p.author) + '"><b>' + esc(p.author) + (p.mine ? '<em class="pl-mine">我</em>' : '') + '</b></button><small>' + esc(p.handle || '') + ' · ' + timeAgo(p.time) + '</small></div>' +
        (p.mine ? '<button class="pl-follow mine" data-pl-delete="' + esc(p.id) + '" aria-label="删除">删除</button>' :
          '<button class="pl-follow' + (followed ? ' on' : '') + '" data-pl-follow="' + esc(p.author) + '">' + (followed ? '已关注' : '+ 关注') + '</button>') +
      '</div>' +
      (p.tag ? '<div class="pl-topic">#' + esc(p.tag) + '#</div>' : '') +
      '<p class="pl-text">' + esc(p.text) + '</p>' +
      imageGrid(p.images) +
      '<div class="pl-actions">' +
        '<button class="pl-act" data-pl-repost="' + esc(p.id) + '">' + IC.repost + '<span>' + (p.reposts || 0) + '</span></button>' +
        '<button class="pl-act" data-pl-comment="' + esc(p.id) + '">' + IC.comment + '<span>' + commentCount(p) + '</span></button>' +
        '<button class="pl-act' + (liked ? ' on' : '') + '" data-pl-like="' + esc(p.id) + '">' + IC.like + '<span>' + likeCount(p) + '</span></button>' +
        '<button class="pl-act' + (faved ? ' on' : '') + '" data-pl-fav="' + esc(p.id) + '">' + IC.fav + '<span>' + favCount(p) + '</span></button>' +
      '</div>' +
      commentBlock(p) +
      '</article>';
  }

  function composeBlock() {
    if (!ui.composing) {
      return '<button class="pl-compose-bar" data-pl-compose>' +
        '<span class="pl-avatar" style="background:#7357D9">' + esc(myName().slice(0, 1)) + '</span>' +
        '<span class="pl-compose-ph">分享你的穿搭灵感…</span>' +
        '<span class="pl-compose-btn">发布</span></button>';
    }
    var thumbs = ui.draftImages.map(function (src, i) {
      return '<div class="pl-thumb"><img src="' + esc(src) + '" alt="待发布图片"><button data-pl-rmimg="' + i + '" aria-label="移除">×</button></div>';
    }).join('');
    return '<div class="pl-composer">' +
      '<div class="pl-composer-top"><b>发布穿搭</b><button class="pl-close" data-pl-cancel>取消</button></div>' +
      '<textarea id="pl-draft-text" class="pl-textarea" maxlength="500" placeholder="分享今天的穿搭心得、灵感或故事…">' + esc(ui.draftText) + '</textarea>' +
      '<div class="pl-thumbs">' + thumbs +
        (ui.draftImages.length < 9 ? '<button class="pl-addimg" data-pl-addimg>' + IC.image + '<small>添加图片</small></button>' : '') +
      '</div>' +
      '<div class="pl-composer-row"><input type="text" id="pl-draft-tag" class="pl-taginput" maxlength="16" placeholder="添加话题，如 今日OOTD（选填）" value="' + esc(ui.draftTag) + '"><button class="pl-publish" data-pl-publish>发布</button></div>' +
      '<input type="file" id="pl-file" accept="image/jpeg,image/png,image/webp" multiple hidden>' +
      '</div>';
  }

  function render() {
    var posts = state.posts.slice().sort(function (a, b) {
      if (ui.tab === 'following') {
        var af = !!state.following[a.author], bf = !!state.following[b.author];
        if (af !== bf) return af ? -1 : 1;
      }
      return b.time - a.time;
    });
    if (ui.tab === 'following') posts = posts.filter(function (p) { return state.following[p.author] || p.mine; });
    var heading = '<div class="pl-head"><span class="pl-head-sub">穿搭灵感，和大家一起分享 · 在这里遇见同好</span></div>';
    var tabs = '<div class="pl-tabs">' +
      '<button class="' + (ui.tab === 'recommend' ? 'on' : '') + '" data-pl-tab="recommend">推荐</button>' +
      '<button class="' + (ui.tab === 'following' ? 'on' : '') + '" data-pl-tab="following">关注</button>' +
      '</div>';
    var feed = posts.length ? posts.map(postCard).join('') :
      '<div class="pl-empty"><span>✦</span><h2>这里还很安静</h2><p>关注一些人，或发布第一条穿搭动态吧。</p></div>';
    return '<div class="yd-page pl-page">' + heading +
      '<div class="pl-body">' + composeBlock() + tabs + '<div class="pl-feed">' + feed + '</div>' +
      '<p class="pl-footnote">广场内容保存在本机 · 无网络时仍可浏览与发布</p></div></div>';
  }

  // 个人主页：微博式封面 + 头像 + 统计 + 动态/收藏 tab
  function renderProfile() {
    var author = profileAuthor || myName(), isMe = author === myName(), av = avatarOf(author);
    var mine = postsBy(author);
    var likes = mine.reduce(function (s, p) { return s + likeCount(p); }, 0);
    var reposts = mine.reduce(function (s, p) { return s + (p.reposts || 0); }, 0);
    var favedCount = Object.keys(state.faved).length, followingCount = Object.keys(state.following).length;
    var followed = !!state.following[author];

    var stats = '<div class="pf-stats">' +
      '<div><b>' + mine.length + '</b><span>动态</span></div>' +
      '<div><b>' + likes + '</b><span>获赞</span></div>' +
      (isMe
        ? '<div><b>' + favedCount + '</b><span>收藏</span></div><div><b>' + followingCount + '</b><span>关注</span></div>'
        : '<div><b>' + reposts + '</b><span>被转发</span></div>') +
      '</div>';

    var action = isMe
      ? '<button class="pf-edit" data-pl-goto-settings>编辑资料</button>'
      : '<button class="pf-follow' + (followed ? ' on' : '') + '" data-pl-follow="' + esc(author) + '">' + (followed ? '已关注' : '+ 关注') + '</button>';

    var tabs = isMe
      ? '<div class="pf-tabs"><button class="' + (ui.profileTab === 'posts' ? 'on' : '') + '" data-pl-ptab="posts">我的动态</button>' +
        '<button class="' + (ui.profileTab === 'faved' ? 'on' : '') + '" data-pl-ptab="faved">我的收藏 <small>' + favedCount + '</small></button></div>'
      : '<div class="pf-tabs"><button class="on">TA 的动态</button></div>';

    var list;
    if (!isMe && ui.profileTab === 'faved') { list = []; }
    else if (ui.profileTab === 'faved' && isMe) {
      list = state.posts.filter(function (p) { return state.faved[p.id]; }).sort(function (a, b) { return b.time - a.time; });
    } else {
      list = mine.slice().sort(function (a, b) { return b.time - a.time; });
    }
    var feed = list.length ? list.map(postCard).join('') :
      '<div class="pl-empty"><span>✦</span><h2>' + (ui.profileTab === 'faved' ? '还没有收藏' : '还没有发布动态') + '</h2><p>' +
      (isMe ? (ui.profileTab === 'faved' ? '在广场里收藏喜欢的穿搭吧。' : '去广场分享你的第一套穿搭灵感。') : 'TA 还没有分享过穿搭。') + '</p>' +
      (isMe ? '<button class="aw-button" data-pl-go-plaza>去广场看看</button>' : '') + '</div>';

    return '<div class="yd-page pl-page pf-page">' +
      '<div class="pf-cover"></div>' +
      '<div class="pf-body">' +
        '<div class="pf-head">' +
          '<div class="pf-avatar" style="background:' + esc(av.color) + '">' + esc(av.letter) + '</div>' +
          '<div class="pf-head-info"><h1>' + esc(author) + (isMe ? '<em class="pl-mine">我</em>' : '') + '</h1><small>' + esc(av.handle || '穿搭旅人 · 记录每一份灵感') + '</small></div>' +
        '</div>' +
        '<p class="pf-bio">' + (isMe ? '衣有归处，心有主意。用穿搭记录每一天。' : '在易搭广场分享穿搭灵感的人。') + '</p>' +
        stats + action + tabs +
        '<div class="pl-feed">' + feed + '</div>' +
      '</div></div>';
  }

  /* ---------- actions ---------- */
  function commit(msg) { return save().then(function () { if (msg) toast(msg); }); }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var im = new Image(), url = URL.createObjectURL(file);
      im.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1000, s = Math.min(1, max / Math.max(im.width, im.height));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s));
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片无法读取')); };
      im.src = url;
    });
  }

  function captureDraft() {
    var t = document.getElementById('pl-draft-text'), g = document.getElementById('pl-draft-tag');
    if (t) ui.draftText = t.value;
    if (g) ui.draftTag = g.value;
  }
  function addImages(files) {
    captureDraft();
    var arr = Array.prototype.slice.call(files).filter(function (f) { return /^image\/(jpeg|png|webp)$/.test(f.type) && f.size <= 10 * 1024 * 1024; }).slice(0, 9 - ui.draftImages.length);
    if (!arr.length) { toast('请选择不超过 10MB 的图片'); return; }
    Promise.all(arr.map(compressImage)).then(function (dataUrls) {
      ui.draftImages = ui.draftImages.concat(dataUrls);
      rerender();
    }).catch(function (e) { toast(e.message || '图片处理失败'); });
  }

  function publish() {
    captureDraft();
    var text = (ui.draftText || '').trim(), tag = (ui.draftTag || '').trim().replace(/^#|#$/g, '');
    if (!text && !ui.draftImages.length) { toast('写点什么或添加图片再发布吧'); return; }
    var name = myName();
    var post = { id: 'p_' + uid(), author: name, handle: '@me', avatar: name.slice(0, 1), avatarColor: '#7357D9',
      time: Date.now(), text: text || '分享一组穿搭 ✦', images: ui.draftImages.slice(), tag: tag, likes: 0, reposts: 0, mine: true };
    state.posts.unshift(post);
    ui.composing = false; ui.draftImages = []; ui.draftTag = ''; ui.draftText = ''; ui.tab = 'recommend';
    commit('已发布到广场').then(rerender);
  }

  function rerender() {
    var stage = document.getElementById('stage');
    if (!stage) return;
    if (profileAuthor !== null || (window.AW && AW.state && AW.state.route === 'profile')) {
      stage.innerHTML = renderProfile();
    } else {
      stage.innerHTML = render();
    }
    bind(stage);
  }

  function toggle(map, id) { if (map[id]) delete map[id]; else map[id] = true; }

  function bind(root) {
    if (!root) return;
    // 进入某个作者的个人主页
    root.querySelectorAll('[data-pl-profile]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); var a = b.getAttribute('data-pl-profile'); setProfile(a); if (window.YidaProduct) YidaProduct.go('profile'); };
    });
    // 个人主页 tab
    root.querySelectorAll('[data-pl-ptab]').forEach(function (b) {
      b.onclick = function () { ui.profileTab = b.getAttribute('data-pl-ptab'); ui.expanded = {}; rerender(); };
    });
    var goPlaza = root.querySelector('[data-pl-go-plaza]');
    if (goPlaza) goPlaza.onclick = function () { if (window.YidaProduct) YidaProduct.go('plaza'); };
    var gotoSettings = root.querySelector('[data-pl-goto-settings]');
    if (gotoSettings) gotoSettings.onclick = function () { if (window.YidaProduct) YidaProduct.go('settings'); };
    root.querySelectorAll('[data-pl-tab]').forEach(function (b) {
      b.onclick = function () { ui.tab = b.getAttribute('data-pl-tab'); ui.expanded = {}; rerender(); };
    });
    var compose = root.querySelector('[data-pl-compose]');
    if (compose) compose.onclick = function () { ui.composing = true; rerender(); };
    var cancel = root.querySelector('[data-pl-cancel]');
    if (cancel) cancel.onclick = function () { ui.composing = false; ui.draftImages = []; ui.draftText = ''; ui.draftTag = ''; rerender(); };
    var dtext = root.querySelector('#pl-draft-text');
    if (dtext) dtext.addEventListener('input', function () { ui.draftText = dtext.value; });
    var dtag = root.querySelector('#pl-draft-tag');
    if (dtag) dtag.addEventListener('input', function () { ui.draftTag = dtag.value; });
    var addimg = root.querySelector('[data-pl-addimg]');
    if (addimg) addimg.onclick = function () { var f = document.getElementById('pl-file'); if (f) f.click(); };
    var file = root.querySelector('#pl-file');
    if (file) file.onchange = function () { addImages(file.files); };
    root.querySelectorAll('[data-pl-rmimg]').forEach(function (b) {
      b.onclick = function () { ui.draftImages.splice(+b.getAttribute('data-pl-rmimg'), 1); rerender(); };
    });
    var pub = root.querySelector('[data-pl-publish]');
    if (pub) pub.onclick = publish;

    root.querySelectorAll('[data-pl-like]').forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute('data-pl-like'); toggle(state.liked, id); commit().then(rerender); };
    });
    root.querySelectorAll('[data-pl-fav]').forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute('data-pl-fav'); toggle(state.faved, id); commit(state.faved[id] ? '已收藏' : '已取消收藏').then(rerender); };
    });
    root.querySelectorAll('[data-pl-repost]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-pl-repost'), p = state.posts.find(function (x) { return x.id === id; });
        if (!p) return;
        var name = myName();
        state.posts.unshift({ id: 'p_' + uid(), author: name, handle: '@me', avatar: name.slice(0, 1), avatarColor: '#7357D9',
          time: Date.now(), text: p.text, images: p.images.slice(), tag: p.tag, likes: 0, reposts: 0, mine: true, repostOf: p.author });
        p.reposts = (p.reposts || 0) + 1;
        commit('已转发到广场').then(rerender);
      };
    });
    root.querySelectorAll('[data-pl-follow]').forEach(function (b) {
      b.onclick = function () { var a = b.getAttribute('data-pl-follow'); toggle(state.following, a); commit(state.following[a] ? '已关注 ' + a : '已取消关注').then(rerender); };
    });
    root.querySelectorAll('[data-pl-comment]').forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute('data-pl-comment'); ui.expanded[id] = !ui.expanded[id]; rerender();
        if (ui.expanded[id]) { var inp = root.querySelector('[data-cmt-input="' + id + '"]'); if (inp) setTimeout(function () { inp.focus(); }, 0); } };
    });
    root.querySelectorAll('[data-cmt-send]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-cmt-send'), inp = root.querySelector('[data-cmt-input="' + id + '"]');
        var text = (inp && inp.value || '').trim(); if (!text) { toast('请输入评论内容'); return; }
        var name = myName();
        state.comments[id] = state.comments[id] || [];
        state.comments[id].push({ author: name, text: text, time: Date.now(), color: '#7357D9' });
        commit('评论已发布').then(rerender);
      };
    });
    root.querySelectorAll('[data-cmt-input]').forEach(function (inp) {
      inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); var b = root.querySelector('[data-cmt-send="' + inp.getAttribute('data-cmt-input') + '"]'); if (b) b.click(); } };
    });
    root.querySelectorAll('[data-pl-delete]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-pl-delete');
        if (window.confirm('删除这条动态？此操作无法撤销。')) {
          state.posts = state.posts.filter(function (x) { return x.id !== id; });
          commit('已删除').then(rerender);
        }
      };
    });
    root.querySelectorAll('[data-pl-zoom]').forEach(function (img) {
      img.onclick = function () {
        var src = img.getAttribute('data-pl-zoom');
        var shade = document.createElement('div'); shade.className = 'pl-lightbox';
        shade.innerHTML = '<img src="' + esc(src) + '" alt="查看大图"><button class="pl-lightbox-close">关闭</button>';
        document.getElementById('phone').appendChild(shade);
        shade.onclick = function () { shade.remove(); };
      };
    });
  }

  /* ---------- public ---------- */
  window.YidaPlaza = {
    init: init,
    render: render,
    bind: bind,
    refresh: rerender,
    myStats: myStats,
    openProfile: function (author) { setProfile(author); },
    renderProfile: renderProfile,
    clearProfile: function () { profileAuthor = null; },
    seedIfEmpty: function () { if (!state.posts.length) { state.posts = seedPosts(); return save(); } return Promise.resolve(); }
  };
})();
