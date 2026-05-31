# CV Mobile

参考libretv编写的Expo 移动端应用（iOS / Android / Web），直连 CMS10 采集站 API，不依赖后端代理层。

## 运行

```bash
cd mobile
npm install
npm start
```

使用 Expo Go、Android 模拟器或 iOS 模拟器打开。
网络受限时可离线启动：

```bash
npm start -- --offline
```

### Web 端

Web 端会自动启动本地 CORS 代理，再打开 Expo：

```bash
npm run web
```

仅启动 Expo Web（不启代理）：

```bash
npm run web:direct
```

### 构建与检查

```bash
npm run android          # 本地运行 Android
npm run ios              # 本地运行 iOS
npm run build:android    # EAS 构建 Android APK（preview）
npm run check            # Babel 编译检查 + 播放地址解析检查
```

## 功能

### 搜索

- 首页输入关键词，并发搜索多个已启用资源站
- 搜索结果展示封面、来源、备注等信息
- 点击结果加载详情并进入播放页

### 分类浏览

- 首页进入「分类」，按资源站切换数据源
- 拉取 CMS `ac=class` 分类列表，点击分类浏览视频
- 支持下拉刷新与滚动分页加载

### 播放

- 解析 `vod_play_url` 中的 HLS（`.m3u8`）地址
- 使用 `expo-video` 播放，支持多线路切换、选集
- **广告过滤**（Web / 移动端各有不同方案，见下方说明）
- 保存播放进度，再次打开时自动续播

### 观看历史

- 打开视频时自动记录，最多保留 30 条
- 首页「历史」可快速重新打开

### 收藏夹

- 点击搜索结果旁的 ♥ 收藏，弹出收藏夹选择面板
- 支持新建收藏夹、记住上次使用的收藏夹
- 同一视频仅存在于一个收藏夹内（换夹即移动）
- 首页「收藏」进入管理：查看文件夹、删除、取消收藏

### 数据源设置

- 首页「设置」开关内置资源站（默认仅启用「如意资源」）
- 支持全选 / 恢复默认
- 支持添加、编辑、删除**自定义 CMS 源**（名称、API、可选 HTML 详情页地址）
- 自定义源自动加入搜索与分类列表

## 平台说明与播放架构


| 平台                           | m3u8 广告过滤方式                                      | 播放引擎                             |
| ---------------------------- | ------------------------------------------------ | -------------------------------- |
| iOS / Android                | 本地过滤：`fetch`→`filterSegmentsText`→写入缓存 `file://` | expo-video（AVPlayer / ExoPlayer） |
| Web（Chrome / Firefox / Edge） | 本地代理过滤：`localhost:19001/m3u8?url=...`            | hls.js（通过 MediaSource API）       |
| Web（Safari）                  | 本地代理过滤：同上                                        | 原生 `<video>` HLS                 |


### 广告过滤说明

**移动端**：App 内部下载原始 m3u8，经 `src/utils/m3u8Filter.js` 解析 → 检测广告段 → 删除 → 所有 URL 展开为绝对路径 → 写入 `expo-file-system` 缓存目录 → `file://` URI 喂给播放器。切换剧集或退出播放页时自动清理缓存文件，App 启动时也会扫尾清理。

**Web 端**：启动 Expo 时一并启动本地代理服务器（`scripts/proxy-server.mjs`，端口 19001），m3u8 请求通过代理完成广告过滤。API 请求也经过此代理绕过浏览器 CORS 限制。

### 其他说明

- 部分资源站可能因防盗链、TLS、线路失效或网络封锁而无法搜索/播放
- HTTP 源已在 `app.json` 配置明文流量允许（`usesCleartextTraffic` / ATS）
- 本地数据（历史、收藏、源设置）保存在 AsyncStorage，卸载 App 会丢失
- `src/utils/m3u8Filter.js` 导出 `filterSegmentsText(text, baseUrl)`，可在任何平台独立使用（纯 JS，无平台依赖）
- 配置源示例 `https://cdn.jsdelivr.net/gh/xxnull233/cv_demo@main/ss.json`

## 项目结构

```
cvdemo/
├── App.js                 # 入口：Provider + 导航 + 启动缓存清理
├── src/
│   ├── api/               # 搜索、分类、详情、解析
│   ├── components/
│   │   ├── HlsVideo.js    # Web HLS 播放器（hls.js / 原生 HLS）
│   │   ├── ResultCard.js  # 搜索结果卡片
│   │   ├── SettingsModal.js
│   │   ├── HistoryModal.js
│   │   └── FavoriteFolderModal.js
│   ├── constants/         # 应用常量
│   ├── context/           # 状态（源、搜索、播放、历史、收藏）
│   ├── hooks/             # 组合逻辑（如打开播放页）
│   ├── navigation/        # React Navigation 路由
│   ├── screens/           # 页面组件
│   ├── styles/            # 样式文件
│   ├── utils/
│   │   └── m3u8Filter.js  # m3u8 广告过滤（无平台依赖）
│   └── storage.js         # AsyncStorage
└── scripts/
    ├── proxy-server.mjs   # Web 代理（CORS + m3u8 广告过滤）
    ├── start-web.js       # 启动脚本（代理 + Expo）
    ├── check.js           # Babel 编译检查
    └── parser-check.js    # 播放地址解析检查
```
