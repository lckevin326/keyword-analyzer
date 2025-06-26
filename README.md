# 关键词分析师

一个集成多种数据源和 AI 技术的专业关键词分析平台，提供"从市场洞察到内容执行到效果追踪"的全链路关键词与内容策略解决方案。

## 功能特色

### 🎯 **四大核心模块**

**模块1：关键词研究中心**
- 🔍 基础关键词搜索 - 竞争对手分析和行业关键词发现
- 📊 深度关键词分析 - 360度关键词分析，包含SERP结果、PAA问题、季节性趋势
- 📈 热门趋势监控 - 实时跟踪热门关键词变化

**模块2：市场竞争分析**
- ⚔️ 关键词差距分析 - 深度对比分析您与竞争对手的关键词策略
- 🏆 高流量页面分析 - 分析竞争对手的高流量页面和内容策略

**模块3：内容创作助手**
- 🤖 AI内容大纲生成 - 基于DeepSeek AI的智能内容大纲创建
- ✨ 标题创意工坊 - AI驱动的吸引性标题生成

**模块4：追踪与监控中心**
- 📍 关键词排名查询 - 手动创建项目查询关键词排名
- 🚨 市场动态监控 - 监控关键词排名变化、竞争对手动态、行业趋势

### 💎 **核心优势**

- 🎯 **全面分析** - 从关键词发现到内容创作到效果监控的完整闭环
- 📊 **数据权威** - 基于权威数据源，确保数据的准确性和实时性
- 🤖 **AI加持** - 集成DeepSeek AI，提供智能内容创作和创意生成
- 👥 **用户友好** - 简洁直观的界面设计，无论您是新手还是专家都能快速上手
- ⚡ **高性能** - 优化的API调用和响应处理，确保快速的用户体验

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth + Google OAuth
- **API集成**: DataForSEO API + DeepSeek AI API
- **AI服务**: DeepSeek Chat API (内容生成和创意)
- **UI组件**: 自定义组件库 (基于shadcn/ui设计系统)
- **图标**: Lucide React
- **部署**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone <项目地址>
cd keyword-analyzer-template
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板文件：

```bash
cp .env.example .env.local
```

配置以下环境变量：

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

### 4. 数据库设置

在 Supabase 中创建以下数据表：

```sql
-- 用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT
);

-- 关键词搜索记录表
CREATE TABLE keyword_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  search_type TEXT CHECK (search_type IN ('competitor', 'trending')) NOT NULL,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX idx_keyword_searches_user_id ON keyword_searches(user_id);
CREATE INDEX idx_keyword_searches_created_at ON keyword_searches(created_at);
```

### 5. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── auth/              # 认证相关页面
│   ├── dashboard/         # 用户仪表板
│   ├── search/           # 基础关键词搜索页面
│   ├── analysis/         # 深度关键词分析页面
│   ├── gap-analysis/     # 关键词差距分析页面
│   ├── top-pages/        # 高流量页面分析页面
│   ├── content-assistant/ # AI内容创作助手页面
│   ├── ranking/          # 关键词排名查询页面
│   ├── monitoring/       # 市场动态监控页面
│   ├── trending/         # 热门趋势页面
│   ├── history/          # 搜索历史页面
│   └── api/              # API 路由
│       ├── keywords/     # 关键词相关 API
│       ├── content/      # AI内容生成 API
│       ├── ranking/      # 排名查询 API
│       └── monitoring/   # 市场监控 API
├── components/           # React 组件
│   ├── ui/              # 基础 UI 组件
│   └── navigation.tsx   # 导航组件
├── lib/                 # 工具库
│   ├── supabase.ts     # Supabase 客户端配置
│   ├── dataforseo.ts   # DataForSEO API 集成
│   ├── deepseek.ts     # DeepSeek AI API 集成
│   └── utils.ts        # 通用工具函数
└── middleware.ts       # Next.js 中间件
```

## 核心功能

### 📊 模块1：关键词研究中心

**基础关键词搜索**
- 输入竞争对手域名，分析其关键词策略
- 获取搜索量、竞争度、CPC等详细数据
- 发现竞争对手的优势关键词

**深度关键词分析**
- 360度关键词分析，包含SERP结果、PAA问题
- 季节性趋势和搜索量变化分析
- 详细的关键词难度和机会评估

**热门趋势监控**
- 实时获取最新的热门关键词
- 按地区筛选趋势数据
- 监控关键词增长率和竞争程度

### ⚔️ 模块2：市场竞争分析

**关键词差距分析**
- 深度对比您与竞争对手的关键词策略
- 发现共同关键词、优势关键词和机会关键词
- 提供具体的关键词机会建议

**高流量页面分析**
- 分析竞争对手的高流量页面
- 按内容类型分类（博客、产品页、分类页等）
- 分析页面关键词数量和流量来源

### 🤖 模块3：内容创作助手

**AI内容大纲生成**
- 基于关键词生成详细的内容大纲
- 智能分析用户搜索意图
- 提供结构化的内容创作建议

**AI标题创意工坊**
- 生成多种风格的吸引性标题
- 基于最佳实践的标题优化建议
- 支持不同类型内容的标题创作

### 📈 模块4：追踪与监控中心

**关键词排名查询**
- 创建项目管理关键词排名
- 实时查询关键词在搜索引擎中的位置
- 支持多个项目和关键词批量查询

**市场动态监控**
- 监控关键词排名变化（跌出前10）
- 追踪竞争对手关键词进入前十的情况
- 检测行业热度一周内飙升50%以上的关键词

### 🗂️ 搜索历史管理
- 保存所有分析记录
- 按模块和时间筛选历史
- 支持搜索记录的查看和管理

## API 说明

### DataForSEO API 集成

本项目集成了 DataForSEO API 来获取关键词和SERP数据。您需要：

1. 在 [DataForSEO](https://dataforseo.com/) 注册账户
2. 获取 API 登录凭据
3. 在环境变量中配置您的凭据

### DeepSeek AI API 集成

本项目集成了 DeepSeek AI API 来提供智能内容生成功能。您需要：

1. 在 [DeepSeek Platform](https://platform.deepseek.com/) 注册账户
2. 获取 API 密钥
3. 在环境变量中配置您的API密钥

### 自定义 API 端点

**基础关键词分析：**
- `POST /api/keywords/competitor` - 竞争对手关键词分析
- `POST /api/keywords/industry` - 行业关键词分析
- `GET /api/keywords/trending` - 获取热门关键词

**深度分析：**
- `POST /api/keywords/analysis` - 关键词深度分析（360度分析）
- `POST /api/keywords/gap-analysis` - 竞争对手关键词差距分析
- `POST /api/keywords/top-pages` - 高流量页面分析

**AI内容创作：**
- `POST /api/content/outline` - AI内容大纲生成
- `POST /api/content/titles` - AI标题创意生成

**排名追踪：**
- `GET /api/ranking/projects` - 获取排名项目列表
- `POST /api/ranking/projects` - 创建新排名项目
- `POST /api/ranking/check` - 查询关键词排名

**市场监控：**
- `POST /api/monitoring/alerts` - 市场动态监控

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 部署

详细的部署说明请参考 [deploy.md](./deploy.md) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License

## 支持

如果您在使用过程中遇到问题，请通过以下方式获取帮助：

1. 查看项目文档
2. 搜索已有的 Issue
3. 创建新的 Issue 描述问题

---

基于 Next.js 和 DataForSEO API 构建 ⚡
