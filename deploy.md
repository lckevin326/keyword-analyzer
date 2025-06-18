# 部署指南

本文档详细说明如何将关键词分析师项目部署到 Vercel，并配置 Supabase 和 Google OAuth 三方登录。

## 准备工作

在开始部署之前，您需要准备以下账户和服务：

1. [Vercel](https://vercel.com/) 账户
2. [Supabase](https://supabase.com/) 账户
3. [Google Cloud Console](https://console.cloud.google.com/) 账户
4. [DataForSEO](https://dataforseo.com/) 账户

## 第一步：配置 Supabase

### 1.1 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 点击 "New Project"
3. 选择组织，输入项目名称（如：keyword-analyzer）
4. 设置数据库密码
5. 选择地区（建议选择离用户最近的地区）
6. 点击 "Create new project"

### 1.2 配置数据库

等待项目创建完成后，进入 SQL Editor，执行以下 SQL 语句创建数据表：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT
);

-- 启用 RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的资料
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 关键词搜索记录表
CREATE TABLE keyword_searches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  search_type TEXT CHECK (search_type IN ('competitor', 'trending')) NOT NULL,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 启用 RLS
ALTER TABLE keyword_searches ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的搜索记录
CREATE POLICY "Users can view own searches" ON keyword_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own searches" ON keyword_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own searches" ON keyword_searches FOR DELETE USING (auth.uid() = user_id);

-- 创建索引提高查询性能
CREATE INDEX idx_keyword_searches_user_id ON keyword_searches(user_id);
CREATE INDEX idx_keyword_searches_created_at ON keyword_searches(created_at DESC);
CREATE INDEX idx_keyword_searches_search_type ON keyword_searches(search_type);

-- 创建函数：自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- 创建触发器：用户注册时自动创建资料
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 1.3 获取 Supabase 环境变量

在 Supabase 项目设置中获取以下信息：

1. 进入项目设置 (Settings) > API
2. 复制以下值：
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon/public key` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role key` (SUPABASE_SERVICE_ROLE_KEY)

### 1.4 配置认证提供商

1. 进入 Authentication > Providers
2. 启用 Email 认证（默认已启用）
3. 配置 Google 认证（下一步会获取 Google OAuth 配置）

## 第二步：配置 Google OAuth

### 2.1 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API：
   - 进入 APIs & Services > Library
   - 搜索 "Google+ API" 并启用

### 2.2 配置 OAuth 同意屏幕

1. 进入 APIs & Services > OAuth consent screen
2. 选择 "External" 用户类型
3. 填写应用信息：
   - App name: 关键词分析师
   - User support email: 您的邮箱
   - Developer contact information: 您的邮箱
4. 添加授权域名：
   - 本地开发：`localhost`
   - 生产环境：您的域名（如：`your-app.vercel.app`）
5. 保存并继续

### 2.3 创建 OAuth 客户端

1. 进入 APIs & Services > Credentials
2. 点击 "Create Credentials" > "OAuth 2.0 Client IDs"
3. 选择 "Web application"
4. 配置授权重定向 URI：
   - 本地开发：`http://localhost:3000/auth/callback`
   - 生产环境：`https://your-app.vercel.app/auth/callback`
5. 创建并保存客户端 ID 和客户端密钥

### 2.4 在 Supabase 中配置 Google OAuth

1. 返回 Supabase Dashboard
2. 进入 Authentication > Providers > Google
3. 启用 Google 提供商
4. 填入 Google OAuth 客户端 ID 和密钥
5. 保存设置

## 第三步：获取 DataForSEO API 凭据

### 3.1 注册 DataForSEO 账户

1. 访问 [DataForSEO](https://dataforseo.com/)
2. 注册账户并验证邮箱
3. 登录后进入 Dashboard

### 3.2 获取 API 凭据

1. 在 Dashboard 中找到 API 设置
2. 获取您的 API 登录用户名和密码
3. 确保账户有足够的余额用于 API 调用

### 3.3 测试 API 连接

可以使用以下命令测试 API 连接：

```bash
curl -u 'your_login:your_password' \
  -H 'Content-Type: application/json' \
  -d '[{"keywords":["seo"],"location_name":"United States","language_name":"English"}]' \
  https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live
```

## 第四步：部署到 Vercel

### 4.1 连接 GitHub 仓库

1. 将代码推送到 GitHub 仓库
2. 登录 [Vercel Dashboard](https://vercel.com/)
3. 点击 "New Project"
4. 选择您的 GitHub 仓库
5. 点击 "Import"

### 4.2 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# DataForSEO API 配置
DATAFORSEO_LOGIN=your-dataforseo-login
DATAFORSEO_PASSWORD=your-dataforseo-password

# NextAuth 配置
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-random-secret-string

# Google OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4.3 部署设置

1. 保持默认的构建设置：
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

2. 点击 "Deploy" 开始部署

### 4.4 配置自定义域名（可选）

1. 在 Vercel 项目设置中进入 "Domains"
2. 添加您的自定义域名
3. 按照指示配置 DNS 记录
4. 等待域名验证完成

## 第五步：更新回调 URL

部署完成后，需要更新各服务的回调 URL：

### 5.1 更新 Google OAuth 设置

1. 返回 Google Cloud Console
2. 更新 OAuth 客户端的授权重定向 URI：
   - 添加：`https://your-app.vercel.app/auth/callback`
3. 保存更改

### 5.2 更新 Supabase 设置

1. 在 Supabase 项目设置中找到 "URL Configuration"
2. 添加您的生产域名到 "Site URL" 列表
3. 保存设置

## 第六步：验证部署

### 6.1 功能测试

部署完成后，请测试以下功能：

1. ✅ 访问首页
2. ✅ 用户注册（邮箱和 Google）
3. ✅ 用户登录
4. ✅ 仪表板访问
5. ✅ 竞争对手关键词分析
6. ✅ 热门趋势查询
7. ✅ 搜索历史查看
8. ✅ 用户登出

### 6.2 性能检查

1. 使用 [Lighthouse](https://developers.google.com/web/tools/lighthouse) 检查性能
2. 检查页面加载速度
3. 验证移动端响应式设计

## 常见问题解决

### Q1: Google OAuth 登录失败

**可能原因：**
- 回调 URL 配置错误
- 客户端 ID 或密钥错误
- OAuth 同意屏幕未配置

**解决方案：**
1. 检查 Google Cloud Console 中的回调 URL 配置
2. 验证环境变量中的 Google 凭据
3. 确保 OAuth 同意屏幕已完成配置

### Q2: DataForSEO API 调用失败

**可能原因：**
- API 凭据错误
- 账户余额不足
- API 限制

**解决方案：**
1. 验证 DataForSEO 登录凭据
2. 检查账户余额
3. 查看 API 调用限制和配额

### Q3: Supabase 连接问题

**可能原因：**
- 环境变量配置错误
- 数据库表未创建
- RLS 策略配置问题

**解决方案：**
1. 检查 Supabase URL 和密钥
2. 确保数据库表已正确创建
3. 验证 RLS 策略配置

### Q4: 部署后页面空白

**可能原因：**
- 环境变量缺失
- 构建错误
- 静态资源加载失败

**解决方案：**
1. 检查 Vercel 部署日志
2. 验证所有环境变量已配置
3. 检查浏览器控制台错误信息

## 监控和维护

### 1. 监控设置

- 配置 Vercel Analytics 监控用户访问
- 设置 Supabase 监控数据库性能
- 监控 DataForSEO API 使用量

### 2. 定期维护

- 定期检查并更新依赖包
- 监控 API 配额使用情况
- 备份重要数据
- 更新安全设置

### 3. 扩展建议

- 添加缓存机制减少 API 调用
- 实现数据导出功能
- 添加用户使用分析
- 考虑添加付费功能

---

🎉 恭喜！您的关键词分析师项目已成功部署到生产环境。如果遇到任何问题，请参考上述常见问题解决方案或查看项目文档。