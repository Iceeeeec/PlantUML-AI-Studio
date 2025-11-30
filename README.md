# PlantUML AI Studio

基于 AI 的 PlantUML 图表生成工具，通过自然语言描述自动生成专业的 UML 图表。

## 功能特性

- **AI 驱动** - 使用 Google Gemini AI 将自然语言转换为 PlantUML 代码
- **实时预览** - 即时渲染生成的 UML 图表
- **代码编辑** - 支持手动编辑和优化生成的 PlantUML 代码
- **多种图表** - 支持类图、时序图、用例图、活动图等多种 UML 图表类型
- **加密传输** - API 请求/响应采用 AES-GCM 加密，保护数据安全

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
