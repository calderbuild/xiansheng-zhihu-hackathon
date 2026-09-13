# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 当前状态

知乎黑客松 2026·校园新锐季参赛项目"先声"。Next.js 16（App Router）+ TypeScript + Tailwind v4，工程计划见 `/Users/calder/.claude/plans/distributed-leaping-bee.md`（源于头脑对齐，任务顺序以它为准）。开发窗口 2026-09-13 10:00 - 09-15 10:00（48 小时）。

代码仓库（GitHub 私有）：`github.com/calderbuild/xiansheng-zhihu-hackathon`，`main` 分支，CloudBase 云托管已接自动部署（push 到 main 即触发构建+发布）。部署环境：腾讯云 CloudBase 个人版，环境 ID `cloud1-6ga7vui99fe83bbb`，服务名 `xiansheng`，容器监听 3000、访问端口映射到 80（Dockerfile 里非 root 用户不能绑 80，见 `Dockerfile` 注释）。**公网体验链接（已端到端验证可用）：`https://xiansheng-313076-9-1338128086.sh.run.tcloudbase.com/`**。

生产环境变量在 CloudBase 控制台单独配置（服务详情 → 更新服务 → 环境变量设置），**不是**从仓库的 `.env.local` 读取——`.dockerignore` 把 `.env.local` 排除在构建上下文之外，这是故意的（凭证不进镜像），但意味着每加一个新的 secret 都要同时在 CloudBase 控制台手动补一份，光加进 `.env.local` 本地能跑、线上会因为拿不到环境变量而报错或静默走不到该分支。当前线上已配置：`ZHIHU_ACCESS_SECRET`、`OPENAI_NEXT_API_KEY`、`OPENAI_NEXT_BASE_URL`、`ZHIHU_OAUTH_APP_ID`、`ZHIHU_OAUTH_APP_KEY`、`ZHIHU_OAUTH_REDIRECT_URI`。**改环境变量优先用"JSON 输入"模式**（环境变量设置区的 tab 切换），整份 JSON 一次性覆盖比逐行填"可视化输入"安全——后者的 key/value 输入框是按 DOM 顺序 0 索引的，点"添加"新增的空行会排在已有行后面，脚本按索引批量填值时如果没数对已有行数，会把新值错误地写进已有行、覆盖掉原有 key，此前踩过一次（写进空 JSON 前一定要先读一遍当前 JSON 全文核对）。

**常用命令**：
- `npm run dev` — 本地开发服务器（`localhost:3000`）
- `npm run build` — 生产构建（`next.config.ts` 设了 `output: 'standalone'`，配合 `Dockerfile` 用）
- `npm test` — Vitest 全部走 mock，零网络请求
- `npm run lint` — ESLint，`--max-warnings=0`
- `npx tsc --noEmit` — 单独类型检查

**已知坑（别重踩）**：
- `askZhida` 用 `zhida-fast-1p5` 时，system-role 指令会被稳定忽略（模型倾向写知乎风格的长文分析而不是私信开场白），把指令+一次性格式范例放进单条 user message（不用 system message）才可靠，已在 `src/app/api/icebreaker/route.ts` 里验证过短/长真实内容两种情况，详见该文件里的 `ponytail:` 注释。
- `/api/icebreaker` 的结果按 `candidate.contentId + situation` 哈希缓存在进程内存（`src/lib/cache.ts`），本地开发时同一对组合会一直吃缓存——测新 prompt 前重启 `npm run dev` 清缓存，或换一个候选人/处境描述。
- CloudBase 免费体验版环境新建后可能直接报"资源已临时隔离"，需升级到个人版（¥19.90/月起）才能用，详见 `~/.claude/projects/-Users-calder-hackathon-ieee-ies-genai-2026/memory/reference_hackathon_execution_playbook.md` 对应条目。
- **CloudBase 容器"运行正常"不代表功能正常**：健康检查只看容器起没起来、端口有没有响应，不检查业务逻辑能不能跑。部署 003 曾长时间显示"正常"，但线上完全没配 `ZHIHU_ACCESS_SECRET`（环境变量设置那栏是空的 `--`），意味着 `/api/discover`、`/api/icebreaker` 会稳定 500——如果没有专门去公网链接手测一次完整流程，这个问题会被"部署成功"的绿色状态完全掩盖。**每次改了会影响生产的配置后，必须实际打开公网 URL 走一遍核心链路（搜索 + 生成开场白），不能只看 CloudBase 控制台的状态灯**。
- `/api/icebreaker` 遇到 `ZhihuQuotaError`（知乎直答 100 次/天配额打满）会自动 fallback 到 `src/lib/openai-fallback.ts`（OpenAI-next 代理，模型 `gpt-4o-mini`）。该端点在 Node 默认 fetch UA 下会被 Cloudflare 拦（403 error 1010），已在实现里带上浏览器 UA 绕过，别去掉这个 header。
- **CloudBase 的反向代理不把公网 Host 转发进容器**：`/api/auth/{login,callback,logout}` 里如果用 `new URL('/', request.url)` 构造重定向目标，线上会解析成容器内部绑定地址 `http://0.0.0.0:3000`（浏览器访问不到，OAuth 登录成功后卡在一个连不上的地址），本地 `npm run dev` 完全看不出这个问题（本地 Host 头正常）。已改用 `getAppOrigin()`（`src/lib/zhihu-oauth.ts`，从 `ZHIHU_OAUTH_REDIRECT_URI` 反推 origin）替代 `request.url`，以后这三个路由的重定向目标一律走这个 helper，不要改回 `request.url`。
- **CloudBase 部署偶发在健康检查阶段失败**（部署日志会看到 `Liveness probe failed: dial tcp <podIP>:80: connect: connection refused`，即使应用自己的启动日志显示 `✓ Ready`），发生频率不低（10 次部署里出现过 6 次），和代码改动无关，直接在"更新服务"里原样重新点一次"部署"通常第二次就能过；失败的版本不会抢占流量（CloudBase 保留上一个"正常"版本继续 100% 服务），所以不是紧急故障，但每次改完生产配置都要盯着部署列表确认最终有一个"正常"版本、且流量确实切过去了。
- **知乎登录回调地址（redirect_uri）要在黑客松项目的编辑页单独登记**，和 `.env.local`/CloudBase 环境变量里的 `ZHIHU_OAUTH_REDIRECT_URI` 必须完全一致，两处不同步会导致点"确认授权"后静默失败（Zhihu 侧 `POST /oauth` 返回 200 但 body 是错误，授权页无任何可见提示）。登记入口：`https://www.zhihu.com/hackathon?activity_code=zhihu_hackathon_2026_p2` → 参赛队伍/项目展示 → "我的项目" → 先声卡片 → "编辑项目" → "知乎登录回调地址"字段（新建项目时默认是占位值 `http://127.0.0.1`，必须手动改成真实回调地址）。

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
