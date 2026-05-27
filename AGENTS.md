# AGENTS.md

## 项目说明
CV Mobile：基于 Expo 的 React Native 影视搜索与播放 App，直连采集站 API，无后端代理层。

## 架构
- 状态：`src/context/`（Source / Search / Player / History / Favorites）
- 路由：`src/navigation/`（React Navigation Native Stack）
- 入口：`App.js` 仅组合 Provider 与 RootNavigator

## 开发规范
- 使用 EXPO
- 代码保持简单，优先可读性
- 新增功能时同步更新 README
- 修改代码后尽量运行测试或启动程序验证

## 交互偏好
- 先解释修改思路，再改代码
- 涉及删除文件、重构目录、安装依赖时先询问
- 回复使用中文

## Codex 特定配置
- 权限模式：自动审查（关键操作需确认
- 默认模型：deepseek-v4-flash
- 技能路径：./.codex/skills（如有）

## CodeGraph

本项目已配置 CodeGraph MCP Server（`codegraph_*` 工具），基于 tree-sitter 的知识图谱索引，提供亚毫秒级结构化代码查询。

### 使用场景
| 问题 | 推荐工具 |
|---|---|
| "X 定义在哪里？" | `codegraph_search` |
| "谁调用了 Y？" | `codegraph_callers` |
| "Y 调用了什么？" | `codegraph_callees` |
| "从 X 到 Y 的调用链" | `codegraph_trace` |
| "改 Z 会影响哪些代码？" | `codegraph_impact` |
| "获取某任务的相关上下文" | `codegraph_context` |
| "查看项目文件结构" | `codegraph_files` |
| "查看索引状态" | `codegraph_status` |

### 规则
- 优先使用 CodeGraph 替代 grep 进行符号查找和结构分析
- 不要用 `codegraph_search` + `codegraph_node` 的组合——直接用 `codegraph_context`
- 不要循环 `codegraph_node` 查多个符号——用 `codegraph_explore` 一次获取
- 索引文件变更后有约 500ms 的写入延迟，编辑后不要立即查询
