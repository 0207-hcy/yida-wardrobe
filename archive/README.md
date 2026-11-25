# 历史版本归档（archive/）

> 本目录只作**历史记录**，保留早期迭代的完整快照；**不再维护、不代表当前产品**，也不要按这里的旧说明在当前版本上操作。
> 当前维护版本在仓库根目录（`frontend/` `android/` `docs/`），工程说明见根目录 [README.md](../README.md) 与 [`docs/ENGINEERING.md`](../docs/ENGINEERING.md)。

## 版本分类总览

| 版本 | 项目 | 状态 | 时间 | 位置 / 回溯方式 |
|---|---|---|---|---|
| v2 · 易搭 YIDA 收尾版 | 电子衣橱 × 穿搭灵感 | ✅ **最新 · 当前维护** | 2026-11-21 | 仓库根目录 `frontend/` `android/` `docs/` |
| v1 · 易搭整合版 1.0 | 易搭早期整合快照 | 🗄 历史快照 | 2026-11-10 并入 | 无独立目录，完整保留在 git 历史（commit `2154cff` 及之前） |
| v0 · outfit-mystic 黑客松版 | AI 玄学搭配（rembg 抠图 + VLM 打标，`:8787`） | 🗄 归档 · 不再维护 | 2026-11-11 | 本目录 [`outfit-mystic/`](./outfit-mystic/) |

## v0 · outfit-mystic 黑客松版（2026-11-11）

西安开元黑客松入围决赛版本。主链路：上传衣服照 → rembg 抠底 → VLM 打标 → 衣橱 → 塔罗约束 → 规则选款 → 三格拼贴结果页。

### 目录内容

| 路径 | 内容 |
|---|---|
| `web/` | 旧版前端（经典脚本 + IIFE）：`index.html`、`app.js`、`engine.js`、样式、数据与塔罗素材 |
| `server/` | 旧版本地小服务 `app.py`（`:8787`，公开仓不含密钥） |
| `design/` | 早期设计稿与界面截图（`_shot/`、`women-preview/`） |
| `scripts/` | 抠图、打标、离线数据构建、冒烟与单元测试脚本 |
| `.env.example` | 旧版密钥字段样例（不含值） |
| `AGENTS.md` / `CLAUDE.md` | 旧版协作约定（Claude Code / Codex 入口） |
| `package.json` | 旧版脚本与测试命令 |

### 仅适用于本归档版本的旧说明

```bash
# 旧版依赖（v0 专用，当前版本不需要）
pip install rembg onnxruntime pillow
# 旧版本地服务
python server/app.py   # http://127.0.0.1:8787
```

> ⚠️ 以上命令与 `rembg`、`:8787`、`web/index.html` 等表述**只对 v0 归档版有效**；当前易搭 YIDA 是零构建、零后端依赖的纯前端，预览方式见根目录 [`PREVIEW.md`](../PREVIEW.md)。
