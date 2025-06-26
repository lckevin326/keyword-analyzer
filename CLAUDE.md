# CLAUDE.md

该文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个名为"关键词分析师"的专业关键词分析平台，集成多种数据源和 AI 技术构建。使用 Next.js 15、TypeScript、React 19 和 Tailwind CSS 4 开发，采用现代化的 App Router 架构。

这是一个完整的"从市场洞察到内容执行到效果追踪"的全链路关键词与内容策略平台，包含四大核心模块：

**模块1：关键词研究中心**
- 基础关键词搜索 - 竞争对手分析和行业关键词发现
- 深度关键词分析 - 360度关键词分析，包含SERP结果、PAA问题、季节性趋势
- 热门趋势监控 - 实时跟踪热门关键词变化

**模块2：市场竞争分析**
- 关键词差距分析 - 深度对比分析您与竞争对手的关键词策略
- 高流量页面分析 - 分析竞争对手的高流量页面和内容策略

**模块3：内容创作助手**
- AI内容大纲生成 - 基于DeepSeek AI的智能内容大纲创建
- 标题创意工坊 - AI驱动的吸引性标题生成

**模块4：追踪与监控中心**
- 关键词排名查询 - 手动创建项目查询关键词排名
- 市场动态监控 - 监控关键词排名变化、竞争对手动态、行业趋势

**通用功能：**
- 用户认证系统 - 支持邮箱注册和 Google OAuth 登录
- 搜索历史管理 - 保存和管理用户的各类分析记录

## 关键命令

- `npm run dev` - 启动开发服务器（使用 Turbopack，运行在 http://localhost:3000）
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器
- `npm run lint` - 运行 ESLint 代码检查

## 技术架构

- **前端框架**: Next.js 15 with App Router
- **语言**: TypeScript（严格模式，配置路径别名 `@/*` 指向 `./src/*`）
- **样式**: Tailwind CSS 4，自定义字体变量（Geist Sans 和 Geist Mono）
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth + Google OAuth
- **API集成**: 多种数据源 API + DeepSeek AI API
- **AI服务**: DeepSeek Chat API（用于内容生成和创意）
- **构建工具**: 开发环境使用 Turbopack
- **代码检查**: ESLint（Next.js core-web-vitals 和 TypeScript 配置）

## 项目结构

```
src/
├── app/                    # Next.js App Router 主目录
│   ├── auth/              # 认证相关页面
│   │   ├── login/page.tsx # 登录页面
│   │   ├── register/page.tsx # 注册页面
│   │   ├── callback/route.ts # OAuth 回调处理
│   │   └── layout.tsx     # 认证页面布局
│   ├── dashboard/page.tsx # 用户仪表板
│   ├── search/page.tsx    # 基础关键词搜索页面
│   ├── analysis/page.tsx  # 深度关键词分析页面
│   ├── gap-analysis/page.tsx # 关键词差距分析页面
│   ├── top-pages/page.tsx # 高流量页面分析页面
│   ├── content-assistant/page.tsx # AI内容创作助手页面
│   ├── ranking/page.tsx   # 关键词排名查询页面
│   ├── monitoring/page.tsx # 市场动态监控页面
│   ├── trending/page.tsx  # 热门趋势页面
│   ├── history/page.tsx   # 搜索历史页面
│   ├── api/               # API 路由
│   │   ├── keywords/      # 关键词相关 API
│   │   │   ├── competitor/ # 竞争对手分析
│   │   │   ├── industry/  # 行业关键词分析
│   │   │   ├── trending/  # 热门趋势
│   │   │   ├── analysis/  # 深度关键词分析
│   │   │   ├── gap-analysis/ # 差距分析
│   │   │   └── top-pages/ # 高流量页面分析
│   │   ├── content/       # AI内容生成 API
│   │   │   ├── outline/   # 内容大纲生成
│   │   │   └── titles/    # 标题创意生成
│   │   ├── ranking/       # 排名查询 API
│   │   │   ├── projects/  # 项目管理
│   │   │   └── check/     # 排名检查
│   │   └── monitoring/    # 市场监控 API
│   │       └── alerts/    # 动态告警
│   ├── layout.tsx         # 根布局（字体配置和元数据）
│   ├── page.tsx          # 首页组件
│   └── globals.css       # 全局样式
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件库
│   │   ├── button.tsx    # 按钮组件
│   │   ├── card.tsx      # 卡片组件
│   │   ├── input.tsx     # 输入组件
│   │   ├── label.tsx     # 标签组件
│   │   ├── select.tsx    # 选择器组件
│   │   └── loading.tsx   # 加载组件
│   ├── navigation.tsx    # 导航组件
│   └── client-layout.tsx # 客户端布局包装器
├── lib/                  # 工具库
│   ├── supabase.ts      # Supabase 客户端配置
│   ├── supabase-server.ts # Supabase 服务端配置
│   ├── keyword-data.ts  # 数据源 API 集成
│   ├── deepseek.ts      # DeepSeek AI API 集成
│   └── utils.ts         # 通用工具函数
├── middleware.ts         # Next.js 中间件（认证保护）
└── public/              # 静态资源
```

## 数据库架构

**Supabase 表结构：**

1. `profiles` - 用户资料表
   - id (UUID, 主键)
   - email (TEXT)
   - full_name (TEXT)
   - avatar_url (TEXT)
   - created_at (TIMESTAMP)

2. `keyword_searches` - 基础关键词搜索记录表
   - id (UUID, 主键)
   - user_id (UUID, 外键)
   - search_type (TEXT: 'competitor' | 'trending' | 'industry')
   - query (TEXT)
   - results (JSONB)
   - created_at (TIMESTAMP)

3. `keyword_analysis` - 深度关键词分析记录表
   - id (UUID, 主键)
   - user_id (UUID, 外键)
   - keyword (TEXT)
   - analysis_data (JSONB)
   - location (TEXT)
   - created_at (TIMESTAMP)

4. `competitor_analysis` - 竞争对手差距分析记录表
   - id (UUID, 主键)
   - user_id (UUID, 外键)
   - your_domain (TEXT)
   - competitor_domain (TEXT)
   - analysis_results (JSONB)
   - location (TEXT)
   - created_at (TIMESTAMP)

5. `top_pages_analysis` - 高流量页面分析记录表
   - id (UUID, 主键)
   - user_id (UUID, 外键)
   - domain (TEXT)
   - analysis_results (JSONB)
   - location (TEXT)
   - created_at (TIMESTAMP)

6. `content_ideas` - AI内容创意记录表
   - id (UUID, 主键)
   - user_id (UUID, 外键)
   - content_type (TEXT: 'outline' | 'titles')
   - input_topic (TEXT)
   - ai_response (TEXT)
   - created_at (TIMESTAMP)

7. `keyword_tracking` - 关键词排名项目表
   - id (UUID, 主键)
   - user_id (UUID, 外键)
   - project_name (TEXT)
   - domain (TEXT)
   - keywords (TEXT[])
   - location (TEXT)
   - tracking_frequency (TEXT)
   - is_active (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

8. `keyword_rankings` - 关键词排名记录表
   - id (UUID, 主键)
   - tracking_id (UUID, 外键)
   - keyword (TEXT)
   - position (INTEGER)
   - url (TEXT)
   - check_date (DATE)
   - created_at (TIMESTAMP)

9. `market_alerts` - 市场动态监控记录表
   - id (UUID, 主键)
   - user_id (UUID, 外键)
   - alert_type (TEXT)
   - alert_data (JSONB)
   - created_at (TIMESTAMP)

## 环境变量配置

必需的环境变量：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 数据源 API 配置
DATAFORSEO_LOGIN=your_data_api_login
DATAFORSEO_PASSWORD=your_data_api_password

# DeepSeek AI API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth 配置
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## API 端点

**内部 API 路由：**

*基础关键词分析：*
- `POST /api/keywords/competitor` - 竞争对手关键词分析
- `POST /api/keywords/industry` - 行业关键词分析
- `GET /api/keywords/trending` - 获取热门关键词

*深度分析：*
- `POST /api/keywords/analysis` - 关键词深度分析（360度分析）
- `POST /api/keywords/gap-analysis` - 竞争对手关键词差距分析
- `POST /api/keywords/top-pages` - 高流量页面分析

*AI内容创作：*
- `POST /api/content/outline` - AI内容大纲生成
- `POST /api/content/titles` - AI标题创意生成

*排名追踪：*
- `GET /api/ranking/projects` - 获取排名项目列表
- `POST /api/ranking/projects` - 创建新排名项目
- `POST /api/ranking/check` - 查询关键词排名

*市场监控：*
- `POST /api/monitoring/alerts` - 市场动态监控

**外部 API 集成：**
- 数据源 API - 获取关键词、SERP、排名等数据
- DeepSeek AI API - AI内容生成和创意
- Supabase Auth API - 用户认证
- Google OAuth API - 第三方登录

## 开发要点

1. **认证流程**: 使用 Supabase Auth，支持邮箱注册和 Google OAuth
2. **路由保护**: 中间件自动重定向未认证用户到登录页
3. **数据安全**: API 密钥存储在服务端，客户端无法访问
4. **错误处理**: 完整的错误处理和用户友好的错误消息
5. **响应式设计**: 全站支持移动端和桌面端
6. **类型安全**: 完整的 TypeScript 类型定义

## 部署说明

详细部署说明请参考 `deploy.md` 文件，包括：
- Vercel 部署配置
- Supabase 数据库设置
- Google OAuth 配置
- 环境变量配置

## 常用操作

**添加新的 UI 组件：**
1. 在 `src/components/ui/` 目录下创建组件
2. 使用 Tailwind CSS 和设计系统变量
3. 导出组件并在需要的地方引入

**添加新的页面：**
1. 在 `src/app/` 相应目录下创建 `page.tsx`
2. 如需保护路由，确保中间件配置正确
3. 使用现有的 UI 组件库构建界面

**集成新的 API：**
1. 在 `src/app/api/` 下创建 API 路由
2. 实现认证检查和错误处理
3. 在前端页面中调用 API

**数据库操作：**
1. 使用 `createServerSupabaseClient()` 在服务端
2. 使用 `supabase` 客户端在客户端
3. 遵循 RLS（行级安全）策略

**功能模块说明：**

*模块1：关键词研究中心*
- `/search` - 基础关键词搜索
- `/analysis` - 深度关键词分析（包含SERP、PAA、季节性数据）
- `/trending` - 热门趋势监控

*模块2：市场竞争分析*
- `/gap-analysis` - 关键词差距分析
- `/top-pages` - 高流量页面分析

*模块3：内容创作助手*
- `/content-assistant` - AI内容大纲生成和标题创意工坊

*模块4：追踪与监控中心*
- `/ranking` - 关键词排名查询（手动项目管理）
- `/monitoring` - 市场动态监控

**API服务集成：**
- DataForSEO服务类在 `src/lib/dataforseo.ts`，包含所有关键词和SERP分析方法
- DeepSeek AI服务类在 `src/lib/deepseek.ts`，提供内容生成和创意功能
- 所有API调用都包含错误处理和Mock数据回退机制