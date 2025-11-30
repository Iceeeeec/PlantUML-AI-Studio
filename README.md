# PlantUML AI Studio

> AI 驱动的下一代 PlantUML 绘图工坊
> 
> 将自然语言转化为专业图表，让绘图像对话一样简单。

## 🚀 核心亮点

### ✨ 智能 AI 辅助 (Powered by Gemini 2.5)

不再苦记复杂的 PlantUML 语法。只需告诉 AI "帮我画一个用户登录的时序图" 或 "修改这个类图增加数据库连接"，AI 即可为您瞬间生成或修改代码。

### 👁️ 实时极速渲染

基于 Kroki 引擎，支持 HTTP POST 渲染。无论代码多长，都能秒级生成预览。彻底解决传统 URL 编码导致的中文乱码和长度限制问题。

### 🎨 交互式无限画布

专为大图设计。支持鼠标滚轮极速缩放和拖拽平移，像浏览地图一样查看您的架构图，细节尽收眼底。

### 🌓 沉浸式体验

精心设计的深色/浅色模式，自动适配系统主题，为您提供舒适的创作环境。

### 🔒 安全加密传输

API 请求/响应采用 AES-GCM 加密，保护您的数据安全。

## 技术栈

**前端**
- React 19 + TypeScript
- Vite
- TailwindCSS
- Lucide Icons

**后端**
- Node.js + Express
- Google Gemini AI API
- AES-GCM 加密

## 项目结构

```
PlantUML-AI-Studio/
├── server/                 # 后端服务（独立部署）
│   ├── server.ts          # Express 服务器
│   ├── crypto.ts          # 加解密工具
│   ├── package.json       # 后端依赖
│   └── .env               # 环境变量 (GOOGLE_API_KEY)
├── services/              # 前端服务
│   └── geminiService.ts   # API 调用
├── utils/                 # 工具函数
│   └── crypto.ts          # 前端加解密
├── App.tsx                # 主应用组件
└── package.json           # 前端依赖
```

## 快速开始

### 前端

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 后端

```bash
cd server

# 安装依赖
npm install

# 配置环境变量
# 编辑 .env 文件，设置 GOOGLE_API_KEY

# 开发模式
npm run dev

# 构建生产版本
npm run build
npm start
```

## 环境变量

### 前端 (.env)
```
VITE_API_URL=https://your-api-domain.com/server
```

### 后端 (server/.env)
```
GOOGLE_API_KEY=your_gemini_api_key
PORT=3001
```

## 部署

### 后端部署

1. 上传 `server/` 目录到服务器
2. 安装依赖：`npm install`
3. 构建：`npm run build`
4. 使用 PM2 运行：`pm2 start dist/server.js --name plantuml-api`

### 前端部署

1. 设置 `VITE_API_URL` 环境变量
2. 构建：`npm run build`
3. 将 `dist/` 目录部署到静态服务器

### Nginx 配置示例

```nginx
location /server/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 使用示例

在输入框中输入自然语言描述，例如：

- "画一个用户登录的时序图"
- "创建一个电商系统的类图，包含用户、订单、商品"
- "画一个订单处理的活动图"

AI 将自动生成对应的 PlantUML 代码并渲染图表。

## License

MIT
