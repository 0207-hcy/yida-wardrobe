# 易搭 YIDA · 电子衣橱 × 穿搭灵感

> 本地优先的移动端穿搭应用：五种玩法收集当日状态，规则引擎从衣橱组合出 4 套搭配，一键确认进历史与海报；另有微博式广场与个人主页。数据只留在本机浏览器，无账号、无云端调用。
> 最新维护版本：**2026-11-21 收尾版**。历史迭代版本统一归档在 [`archive/`](./archive/README.md)，见文末版本分类表。

## 🔎 速览 / AT A GLANCE

**一句话** — 不联网也能用的电子衣橱：五种玩法收集当日状态，规则引擎从衣橱里组合出 4 套搭配。
**我的角色** — 规则引擎与搭配逻辑、本地优先数据层、安卓壳打包、界面与交互
**技术栈** — `原生 H5` `IndexedDB` `Capacitor` `零构建 / 零后端`
**关键数字** — 5 种玩法 → 4 套搭配；数据只留本机；v2 收尾版 2026-11-21
**在线预览** — https://ccccongggg.github.io/yida-wardrobe/frontend/ （建议 390 × 844）
**作品档案** — [projects.html · IDX 009 ↗](https://ccccongggg.github.io/projects.html)

## 🚀 在线预览（零安装，浏览器直接打开）

| 入口 | 地址 |
|---|---|
| 🏠 项目导航页（含截图与入口按钮） | **https://ccccongggg.github.io/yida-wardrobe/** |
| ▶️ 直接打开易搭 App | **https://ccccongggg.github.io/yida-wardrobe/frontend/** |

- 建议用手机，或桌面浏览器切到设备模式 **390 × 844**。
- 纯静态展示：所有数据只存在本机 IndexedDB，不上传服务器；「添加衣物」走本机降级模式（不抠图、保留原背景、标签手动核对），页面会明确提示——**这是设计行为，不是故障**。
- 其它方式（离线双击、本地静态服务、安卓端、体验路线、FAQ）见 [`PREVIEW.md`](./PREVIEW.md)。

## 📌 工程与简历材料

| 想看什么 | 去哪 |
|---|---|
| 功能表 / 架构图 / 6 条量化工程亮点 | [`docs/ENGINEERING.md`](./docs/ENGINEERING.md) |
| 简历可复制文案（项目描述 / bullet / 面试口述） | [`docs/RESUME.md`](./docs/RESUME.md) |
| 架构图 SVG | [`docs/architecture.svg`](./docs/architecture.svg) |
| 效果截图 | [`docs/screenshots/`](./docs/screenshots/) |
| 安卓端工程说明 | [`android/README.md`](./android/README.md) |
| 完整预览指南 | [`PREVIEW.md`](./PREVIEW.md) |

**公开范围**：完整可运行前端（用户本人确认公开）；**不含**密钥、发布签名与 keystore、服务端实现、商业化方案、内部研发文档。演示素材仅用于本地效果展示，未声明商用授权。**APK 安装包不在仓库内**（发布相关资产不公开）。

## 🗂 版本分类（各迭代在哪）

| 版本 | 项目 | 状态 | 时间 | 位置 |
|---|---|---|---|---|
| v2 · 易搭 YIDA 收尾版 | 电子衣橱 × 穿搭灵感（当前成品） | ✅ **最新 · 当前维护 · 简历请用这个** | 2026-11-21 | 仓库根目录 `frontend/` `android/` `docs/` |
| v1 · 易搭整合版 1.0 | 易搭早期整合快照 | 🗄 历史快照 | 2026-11-10 并入 | 已被 v2 替换，完整保留在 git 历史（commit `2154cff` 及之前）可回溯 |
| v0 · outfit-mystic 黑客松版 | AI 玄学搭配（rembg + VLM，`:8787`） | 🗄 归档 · 不再维护 | 2026-11-11 | [`archive/outfit-mystic/`](./archive/outfit-mystic/)，说明见 [`archive/README.md`](./archive/README.md) |

> 一句话判断：根目录 `frontend/` 就是最新成品；`archive/` 下的内容只作历史记录，不代表当前版本，也不要按旧说明操作。

## 边界说明

本仓库为**作品展示快照**，非正式发布版本：无账号体系、无服务端、无应用商店包；发布签名、凭据、服务端能力与商业化方案均不在公开范围。