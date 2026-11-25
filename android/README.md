# 安卓端｜工程说明（脱敏）

本项目用 **Capacitor 6** 把同一套 H5 装进 Android WebView，没有原生业务代码，前端是唯一真相源。

| 项 | 值 |
|---|---|
| 框架 | Capacitor 6.2.3（core / cli / android 版本锁定） |
| appId | `com.yida.app` |
| 构建环境 | JDK 17 · Android SDK 35 · Build Tools 35.0.0 · Gradle |
| WebView 资源 | `assets/public`，132 条目 |
| 验证 | debug APK 可安装，AVD 模拟器实拍见 [`../docs/screenshots/emulator.jpg`](../docs/screenshots/emulator.jpg) |

## 三步重编（缺一步会「假成功」）

只把 `frontend/` 同步到 `www/` 而不执行 `cap sync`，Gradle 仍会显示 `BUILD SUCCESSFUL`，但 APK 里没有新文件。完整流程：

```bash
# 1) frontend/ 单向镜像到 www/（robocopy /MIR，排除 *.md）
# 2) 把 www 写进 android assets
npx cap sync android
# 3) 编译（新进程需显式设置 JAVA_HOME / ANDROID_HOME）
./gradlew.bat assembleDebug --no-daemon
```

## 每次重编后的自检

解包 APK，断言 `assets/public/index.html`、`js/v11/product.js`、五玩法数据、主题样式、广场模块等关键条目存在；并把 `product.js` 与源码逐字节比对，确认三处（源码 / www / APK）一致。

## 已知坑位（工程笔记）

| 现象 | 根因 | 处理 |
|---|---|---|
| Gradle 成功但 APK 未更新 | 漏了 `cap sync` | 严格三步 |
| AGP 报非 ASCII 路径检查 | 工程目录含中文 | `android.overridePathCheck=true` |
| `aapt` / `adb` 读不了路径 | 原生工具对中文路径支持差 | 先把 APK 复制到纯 ASCII 临时目录再 install |
| `JAVA_HOME is not set` | 新 shell 进程读不到用户级环境变量 | 编译前显式导出 |

> **发布签名、keystore 与 release 构建配置属于上线资产，未包含在本公开仓库。** 本目录仅用于说明端侧工程链路。
