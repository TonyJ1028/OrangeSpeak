# OrangeSpeak Mobile API 文档

## 基础信息
- 基础URL: `http://localhost:3000/api`
- 所有请求都需要在 header 中携带 token: `Authorization: Bearer <token>`
- 所有响应格式均为 JSON

## 认证相关

### 登录
- 请求方式：POST
- 路径：`/auth/login`
- 请求体：
```json
{
  "username": "string",
  "password": "string"
}
```
- 响应：
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
```

### 注册
- 请求方式：POST
- 路径：`/auth/register`
- 请求体：
```json
{
  "username": "string",
  "password": "string",
  "email": "string" // 可选
}
```
- 响应：
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
```

## 频道相关

### 获取频道列表
- 请求方式：GET
- 路径：`/channels`
- 响应：
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "isVoiceChannel": boolean,
    "createdAt": "string"
  }
]
```

### 创建频道
- 请求方式：POST
- 路径：`/channels`
- 请求体：
```json
{
  "name": "string",
  "description": "string", // 可选
  "isVoiceChannel": boolean
}
```
- 响应：返回创建的频道对象

### 加入频道
- 请求方式：POST
- 路径：`/channels/{channelId}/join`
- 响应：200 表示成功

### 离开频道
- 请求方式：POST
- 路径：`/channels/{channelId}/leave`
- 响应：200 表示成功

### 获取频道用户列表
- 请求方式：GET
- 路径：`/channels/{channelId}/users`
- 响应：
```json
[
  {
    "id": "string",
    "username": "string",
    "email": "string"
  }
]
```

## 消息相关

### 获取消息列表
- 请求方式：GET
- 路径：`/channels/{channelId}/messages`
- 查询参数：
  - `before`: number (可选，获取此消息 ID 之前的消息)
  - `limit`: number (可选，默认 50，最大返回消息数)
- 响应：
```json
[
  {
    "id": "string",
    "content": "string",
    "type": "text",
    "sender": {
      "id": "string",
      "username": "string"
    },
    "channelId": "string",
    "createdAt": "string",
    "metadata": {} // 可选
  }
]
```

### 发送消息
- 请求方式：POST
- 路径：`/channels/{channelId}/messages`
- 请求体：
```json
{
  "content": "string",
  "type": "text",
  "metadata": {} // 可选
}
```
- 响应：返回创建的消息对象

### 编辑消息
- 请求方式：PUT
- 路径：`/channels/{channelId}/messages/{messageId}`
- 请求体：
```json
{
  "content": "string"
}
```
- 响应：返回更新后的消息对象

### 删除消息
- 请求方式：DELETE
- 路径：`/channels/{channelId}/messages/{messageId}`
- 响应：200 表示成功

### 搜索消息
- 请求方式：GET
- 路径：`/channels/{channelId}/messages/search`
- 查询参数：
  - `q`: string (搜索关键词)
- 响应：返回匹配的消息列表

## 语音相关

### 获取语音 Token
- 请求方式：GET
- 路径：`/voice/token`
- 响应：
```json
{
  "token": "string"
}
```
