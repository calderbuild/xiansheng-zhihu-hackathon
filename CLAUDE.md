# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 当前状态

这是知乎黑客松 2026·校园新锐季的参赛仓库。**目前没有任何应用代码**，只有赛前调研文档和官方发的 Zhihu skill 包。开发窗口是 2026-09-13 10:00 - 09-15 10:00（48 小时），窗口开启前不要假设已经有代码结构可复用。

不是 git 仓库。没有 package.json / requirements.txt / 任何构建配置——不用去找 build/lint/test 命令，现在没有。一旦开始写代码，把实际用到的运行/测试命令补进本文件。

## 权威信息源，别重复调研

- **`CONTEXT.md`** 是本项目的权威结论文档：报名/组队状态、时间线、评分权重、知乎平台接口与配额实测、原创性红线、S1（首届）获奖名单深读、真实用户痛点的一手证据。任何"要不要做 X / 这个方向有没有人做过"类问题先读这份，不要重新搜索——里面标了哪些结论是逐字核实过的、哪些是子 agent 未复核的。
- **`docs/official-handbook.md`** 是官方开发者手册全文（飞书原文存档）。`CONTEXT.md` 与手册冲突时以手册为准；需要查手册原文直接读这份本地存档，不要重新 `lark-cli docs +fetch`。
- 待办/未解问题列在 `CONTEXT.md` 末尾"待办"一节，动手前先看有没有已知阻塞项。

## 知乎官方 Skill（`.claude/skills/zhihu/`）

官方发的 Claude Code skill 包，封装了知乎开放平台的鉴权、限流、重试。**日常调用 API 一律走这个 skill 的 CLI，不要自己拼 HTTP 或重写鉴权逻辑**（`me contents`、`search zhihu/global`、`hot`、`answer`、`question recommend/answers`、`knowledge bases/items/search/upload`、`quota`）。命令全集和参数见 `.claude/skills/zhihu/SKILL.md`，不确定参数就 `<CLI> <command> --help`。

硬约束（写代码前必须知道）：

- **所有 Access Secret 共享同一额度池**，且网页测试台和 API 调用共享同一池子——调试时别在 developer.zhihu.com 网页测试台乱点，会烧真实额度。额度是否按天重置尚未官方确认（`CONTEXT.md` 里的未解风险），架构上要为"一次性池"场景做缓存和降级。
- **鉴权凭证一律走环境变量/部署平台 Secret，不写进代码仓库**——官方《技术指南》给的示例 prompt 建议硬编码，那是错的，官方自己的检查清单也禁止。OAuth 的 `app_id`/`app_key`（项目"先声"，π队，2026-09-13 创建项目后领取）存在项目根 `.env.local`（已加入 `.gitignore`，不会被提交）；CLI 用的 Access Secret 另存在系统 Keychain。
- 本人数据接口（`/api/v1/user/*`）只能读 Access Secret 所属账号自己的数据；读别人的数据必须走知乎 OAuth（`references/hackathon-oauth.md`），不能用 CLI 代查。
- MCP 只覆盖搜索/直答/热榜，不覆盖用户数据/关注/收藏；那五个接口只能走 REST，且必须带 `X-Request-Timestamp` 秒级时间戳。
- CLI 不带二进制，`scripts/setup.sh`/`setup.ps1` 首次运行会向官方 manifest 下载校验安装，需要用户明确同意才执行。

## 交付与合规红线（决定选题和架构）

- **原创性是取消资格级红线**：作品必须是团队独立创作，"已在其他竞赛获奖/公开发布的项目"不得整体提交（`CONTEXT.md` 里已判定：把已公开的旧项目当新组件复用是灰色地带，需问官方，别自己下判断）。
- **初审只看作品本身+计划书，不看演讲**（初审权重：AI 场景价值 40% / 创新度 25% / 完成度 25% / 体验设计 10%）。决赛才是 3 分钟 demo + 2 分钟 Q&A，PPT 只是辅助。
- **必交物**：公网可访问的可运行体验链接（+ 若有登录功能需提供测试账号密码）、产品说明计划书。代码仓库链接和演示视频是选交加分项，不是必交。
- **接入知乎 OAuth 的登录人数是人气奖评定依据之一**——如果做的方向涉及"分析我自己/授权用户的知乎数据"，接 OAuth 登录本身就是加分动作，不只是功能需求。
- 严禁批量爬取/滥用站内用户数据绕开官方 API。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
