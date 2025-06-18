# 关键词分析师

一个基于 DataForSEO API 的专业关键词分析平台，帮助您发现热门关键词，洞察市场趋势，分析竞争对手策略。

## 功能特色

- 🎯 **竞争对手分析** - 输入对标产品或行业信息，快速发现竞争对手正在使用的热门关键词
- 📈 **热门趋势监控** - 实时跟踪最近一周的热门关键词，把握市场动态和用户需求变化
- 📊 **数据洞察** - 详细的搜索量、竞争度、CPC等数据分析，为您的营销策略提供数据支撑
- 🔍 **智能搜索** - 基于AI算法的智能关键词推荐，发现您可能忽略的高价值关键词
- 👥 **用户友好** - 简洁直观的界面设计，无论您是新手还是专家都能快速上手使用
- ⚡ **高性能API** - 基于DataForSEO权威数据源，确保数据的准确性和实时性

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth + Google OAuth
- **API集成**: DataForSEO API
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

# DataForSEO API 配置
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password

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
│   ├── search/           # 关键词搜索页面
│   ├── trending/         # 热门趋势页面
│   ├── history/          # 搜索历史页面
│   └── api/              # API 路由
├── components/           # React 组件
│   ├── ui/              # 基础 UI 组件
│   └── navigation.tsx   # 导航组件
├── lib/                 # 工具库
│   ├── supabase.ts     # Supabase 客户端配置
│   ├── dataforseo.ts   # DataForSEO API 集成
│   └── utils.ts        # 通用工具函数
└── middleware.ts       # Next.js 中间件
```

## 核心功能

### 竞争对手分析
- 输入竞争对手域名，分析其关键词策略
- 获取搜索量、竞争度、CPC等详细数据
- 发现竞争对手的优势关键词

### 行业关键词分析
- 输入行业或产品类别
- 获取相关的热门关键词
- 分析市场趋势和机会

### 热门趋势监控
- 实时获取最新的热门关键词
- 按地区筛选趋势数据
- 监控关键词增长率和竞争程度

### 搜索历史管理
- 保存所有搜索记录
- 按类型和时间筛选历史
- 支持搜索记录的删除和管理

## API 说明

### DataForSEO API 集成

本项目集成了 DataForSEO API 来获取关键词数据。您需要：

1. 在 [DataForSEO](https://dataforseo.com/) 注册账户
2. 获取 API 登录凭据
3. 在环境变量中配置您的凭据

### 自定义 API 端点

- `POST /api/keywords/competitor` - 竞争对手关键词分析
- `POST /api/keywords/industry` - 行业关键词分析
- `GET /api/keywords/trending` - 获取热门关键词

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
