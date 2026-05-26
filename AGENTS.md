# AGENTS.md

## 项目说明
CV Mobile：基于 Expo 的 React Native 影视搜索与播放 App，直连采集站 API，无后端代理层。

## 架构
- 状态：`src/context/`（Source / Search / Player / History / Favorites）
- 路由：`src/navigation/`（React Navigation Native Stack）
- 入口：`App.js` 仅组合 Provider 与 RootNavigator

## 开发规范
- 使用 EXPO
- 代码保持简单，优先可读性
- 新增功能时同步更新 README
- 修改代码后尽量运行测试或启动程序验证

## 交互偏好
- 先解释修改思路，再改代码
- 涉及删除文件、重构目录、安装依赖时先询问
- 回复使用中文

## Codex 特定配置
- 权限模式：自动审查（关键操作需确认
- 默认模型：deepseek-v4-flash
- 技能路径：./.codex/skills（如有）