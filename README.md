# OrangeMessage

OrangeMessage 是一个类 TeamSpeak 的应用程序，基于 NestJS 和 mediasoup 构建，提供语音聊天、文字聊天和用户管理功能。

## 主要功能

- 用户认证与管理系统
- 基于 WebRTC (mediasoup) 的群组语音聊天
- 群组文字聊天
- 私人消息
- 实时通讯功能

## 技术栈

- 后端框架：NestJS
- 实时通讯：WebSocket, WebRTC
- 数据库：MySQL
- 媒体服务器：mediasoup
- 前端技术：React + TypeScript

## 系统要求

- Node.js (v16 或更高版本)
- npm 或 yarn
- MySQL (v8.0 或更高版本)

## 安装步骤

### 1. 数据库配置

创建 MySQL 数据库：
```sql
CREATE DATABASE orange_message;
```

### 2. 环境配置

1. 克隆项目：
```bash
git clone https://github.com/yourusername/OrangeMessage.git
cd OrangeMessage
```

2. 安装依赖：
```bash
# 安装后端依赖
cd service
npm install

# 安装前端依赖
cd ../web
npm install
```

3. 配置环境变量：
   - 复制 `.env.example` 文件为 `.env`
   - 根据实际情况修改配置参数

### 3. 启动服务

1. 启动后端服务：
```bash
cd service
npm run start:dev
```

2. 启动前端服务：
```bash
cd web
npm start
```

## 项目结构

```
OrangeMessage/
├── service/          # 后端服务
│   ├── src/         # 源代码
│   └── test/        # 测试文件
└── web/             # 前端应用
    ├── src/         # 源代码
    └── public/      # 静态资源
```

## 开发说明

- 后端 API 文档访问地址：`http://localhost:3000/api`
- WebSocket 服务端口：3001
- 前端开发服务器端口：3002

## 贡献指南

1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
