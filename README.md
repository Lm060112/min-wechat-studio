# Min's Diary Studio · 敏儿手记

个人微信公众号视觉设计与内容工作台。采用 React + TypeScript + Vite，无需数据库、登录或付费 API。米白与鼠尾草绿，文字优先，适合长期记录生活、成长与技术实践。

## 功能

- 工作台：草稿卡片、栏目筛选、全文搜索、复制与删除。
- 三套封面母版：此刻有感、技术与实践、成长手记。可修改标题、日期、署名，上传照片；Canvas 共用同一渲染逻辑，预览与导出一致。
- PNG 导出：900 × 383 主封面、600 × 600 方形缩略图；会检查标题溢出。
- Markdown 编辑：标题、加粗、引用、分割线、列表、代码及图片，支持本地图片和 HTTPS 图片链接，手机实时阅读预览。
- Markdown / HTML 导出；HTML 经 DOMPurify 清理。微信后台可能过滤 HTML 和样式，发布前需检查并重新上传图片。HTML 导出适合浏览器查看和复制排版，不代表能直接导入微信。
- 自动保存到当前浏览器的 localStorage；JSON 导出、校验与合并导入备份，同 ID 内容由导入文件覆盖，导入前有确认。
- 视觉规范：品牌颜色、系统字体与排版建议。

首次打开包含三篇示例草稿，可直接编辑或删除。数据不跨设备同步；清理浏览器数据会删除草稿，请定期导出 JSON。图片在浏览器内压缩至最长边 1600px 后保存，单张上传限制 8 MB。超出浏览器存储配额时会明确提示，需导出备份。隐私模式的持久性由浏览器决定。应用不会向服务器上传草稿或图片；正文外部图片链接会向对应站点发起请求。

## 云环境

项目目录：`/workspace/min-wechat-studio`。此项目已在云环境安装依赖、构建并通过 Chromium 浏览器测试，用户无需在 Mac 上执行命令。

供云端代理或 CI 使用：

```sh
npm ci
npm run dev -- --port 5173
npm run build
npm test
```

开发服务监听 `0.0.0.0:5173`。生产构建位于 `dist/`，可部署到任意静态托管服务；生产预览使用 `npm run preview -- --port 4173`。当前云环境若不提供端口映射，localhost 仅供内部验证，不能作为外部可访问链接。

Node.js 20.19+ 或 22.12+（当前验证为 Node.js 24）。有锁文件，使用 `npm ci` 重现依赖。测试优先使用 `/usr/bin/chromium`，也可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定；无系统 Chromium 时使用 Playwright 默认安装位置。一般 CI 可先运行 `npx playwright install --with-deps chromium`。

Chrome 与 Safari 优先：采用标准 Canvas、FileReader、Blob 下载和 localStorage；当前自动化仅实测 Chromium，尚未在真实 Safari 上验证。

## 验证

`npm run build` 执行 TypeScript 检查与 Vite 生产构建。`npm test` 运行 4 个 Playwright 场景，验证：

1. 首页、栏目筛选、搜索、视觉规范导航、390px 手机布局。
2. 编辑与刷新持久化、Markdown/HTML 下载、脚本过滤、正文图片上传。
3. 三套母版、照片上传与移除、PNG 文件头中的精确宽高。
4. JSON 备份下载、恢复、无效备份保护。

浏览器检查截图见 `artifacts/`。

## 目录

- `src/main.tsx`：页面、草稿存储、Canvas 封面生成、文章预览与导出。
- `src/style.css`：品牌样式、响应式布局、阅读排版。
- `tests/studio.spec.ts`：浏览器端完整交互测试。
- `playwright.config.ts`：启动服务与浏览器配置。

## GitHub 提交方案

将本次修改提交到功能分支 `feat/mins-diary-studio`，以 `main` 为目标创建 PR。建议标题：`feat: build Min's Diary Studio`。PR 说明应包含上述功能、构建和 4 项 Chromium 测试结果，以及“尚未实测 Safari、草稿保存在当前浏览器”的限制。本任务不自动推送或发布。
