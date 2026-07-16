# YAO 投资管理系统

日本高端房地产投资管理 CRM（React + Supabase + Vercel）。

## 在线地址

- **主站：** https://yao-system.vercel.app
- **GitHub Pages：** https://wh19951212-blip.github.io/yao-system/

## 本地开发

```bash
cp .env.example .env   # 填入 Supabase URL / anon key
npm install
npm run dev
```

## 数据库初始化（Supabase SQL Editor）

1. 新建项目后运行 **`supabase/bootstrap.sql`**（建表 + 权限）
2. 或运行 **`supabase/seed_demo.sql`**（权限 + 展示案例数据）

> 勿仅使用 Downloads 里的旧版 `supabase_schema_full.sql`，缺少部分表和字段。

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `ANTHROPIC_API_KEY` | AI 功能（仅 Vercel 服务端，不要放 VITE_ 前缀） |

## 部署

```bash
npm run deploy:vercel   # 构建 + Vercel 生产部署 + 自动 alias
npm run deploy:pages    # GitHub Pages
```

## 演示模式

数据库为空时，系统自动加载内置展示案例（只读）。顶部蓝色横幅会提示。写入真实数据请运行 `seed_demo.sql`。

## 技术栈

- React 19 + TypeScript + Vite 6 + Tailwind 3
- Supabase（PostgreSQL + Auth + Storage）
- Vercel Serverless（Supabase / Anthropic 代理）
