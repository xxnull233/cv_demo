# CV Mobile

Expo 移动端应用（iOS / Android / Web）。直连苹果 CMS10 采集站 API，不依赖 Express `/proxy` 后端。

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
- 使用 `expo-av` 播放，支持多线路切换、选集、倍速

### 观看历史

- 打开视频时自动记录，最多保留 30 条
- 首页「历史」可快速重新打开

### 收藏夹

- 点击搜索结果旁的 ♡ 收藏，弹出收藏夹选择面板
- 支持新建收藏夹、记住上次使用的收藏夹
- 同一视频仅存在于一个收藏夹内（换夹即移动）
- 首页「收藏」进入管理：查看文件夹、删除、取消收藏

### 数据源设置

- 首页「设置」开关内置资源站（默认仅启用「如意资源」）
- 支持全选 / 恢复默认
- 支持添加、编辑、删除**自定义 CMS 源**（名称、API、可选 HTML 详情页地址）
- 自定义源自动加入搜索与分类列表

## 平台说明

| 平台 | 网络请求 | 备注 |
|------|----------|------|
| iOS / Android | 直连 API | 无浏览器 CORS 限制 |
| Web | 经 `localhost:19001` 代理转发 | 由 `npm run web` 自动启动 |

其他说明：

- 部分资源站可能因防盗链、TLS、线路失效或网络封锁而无法搜索/播放
- HTTP 源已在 `app.json` 配置明文流量允许（`usesCleartextTraffic` / ATS）
- 本地数据（历史、收藏、源设置）保存在 AsyncStorage，卸载 App 会丢失

## 项目结构

```
mobile/
├── App.js                 # 入口：Provider + 导航
├── src/
│   ├── api/               # 搜索、分类、详情、解析
│   ├── components/        # 卡片、弹窗
│   ├── constants/         # 应用常量
│   ├── context/           # 状态（源、搜索、播放、历史、收藏）
│   ├── hooks/             # 组合逻辑（如打开播放页）
│   ├── navigation/        # React Navigation 路由
│   ├── screens/           # 页面组件
│   └── storage.js         # AsyncStorage
└── scripts/
```

## 内置资源站

见 `src/api/sites.js`，包含如意、森林、天涯、暴风等 CMS 源。可通过设置页追加自定义源。
