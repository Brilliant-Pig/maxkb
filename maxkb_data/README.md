# MaxKB 数据包使用指南

## 📋 前置要求

- Docker Desktop 已安装并运行
- 至少 4GB 可用磁盘空间
- 至少 2GB 可用内存

## 🚀 快速开始

### 方法一：使用 Docker Compose（推荐）

1. 将整个 maxkb_data 文件夹复制到你的电脑

2. 打开终端/PowerShell，进入目录：
   `ash
   cd D:\maxkb_data
   `

3. 启动 MaxKB：
   `ash
   docker-compose up -d
   `

4. 等待启动完成（约 30 秒）

5. 访问 Web 界面：
   `
   http://localhost:8090
   `

### 方法二：使用 Docker 命令

`ash
docker run -d 
  --name maxkb 
  -p 8090:8080 
  -v D:\maxkb_data\data:/opt/maxkb/data 
  -v D:\maxkb_data\conf:/opt/maxkb/conf 
  -v D:\maxkb_data\logs:/opt/maxkb/logs 
  -v D:\maxkb_data\local:/opt/maxkb/local 
  -v D:\maxkb_data\app:/opt/maxkb/app 
  -e POSTGRES_PASSWORD=Password123@postgres 
  -e REDIS_PASSWORD=Password123@redis 
  -e MAXKB_DB_NAME=maxkb 
  -e MAXKB_DB_USER=root 
  -e MAXKB_REDIS_HOST=127.0.0.1 
  -e MAXKB_REDIS_PORT=6379 
  -e MAXKB_REDIS_DB=0 
  1panel/maxkb:v2.3.0
`

## 🔐 登录信息

| 项目 | 值 |
|------|-----|
| 地址 | http://localhost:8090 |
| 用户名 | admin |
| 密码 | MaxKB@123.. |

**首次登录后请立即修改密码！**

## 📦 数据内容

本数据包包含：

- ✅ 3 个模型配置（包括 API 密钥）
- ✅ 1 个知识库："操作系统课程"
- ✅ 5 个文档（已上传的 PDF/Markdown 文件）
- ✅ 1 个应用："操作系统课程知识库"
- ✅ 所有聊天记录和配置

## 🔧 常用命令

`ash
# 查看容器状态
docker ps | findstr maxkb

# 查看日志
docker logs maxkb

# 停止容器
docker-compose down

# 启动容器
docker-compose up -d

# 重启容器
docker-compose restart
`

## ❓ 故障排查

### 问题 1：容器启动失败
`ash
# 查看详细日志
docker logs maxkb

# 检查端口是否被占用
netstat -ano | findstr 8090
`

### 问题 2：无法访问 Web 界面
- 检查防火墙设置
- 确认容器正在运行：docker ps
- 尝试访问：http://127.0.0.1:8090

### 问题 3：数据丢失
- 确认数据目录路径正确
- 检查数据目录权限

## 📝 注意事项

1. **不要删除** data 目录中的任何文件
2. **不要修改** conf 目录中的配置文件
3. **API 密钥** 已包含在数据库中，无需额外配置
4. 所有文件存储在数据库中，不需要 uploads 目录

## 📂 目录结构

`
maxkb_data/
├── data/              # 数据目录（最重要！）
│   ├── postgresql/    # PostgreSQL 数据库
│   └── redis/         # Redis 数据
├── conf/              # 配置文件
├── logs/              # 日志文件
├── local/             # 本地数据
├── app/               # 应用配置
├── maxkb-app/         # 应用代码（备用）
└── docker-compose.yml # Docker Compose 配置
`

## 💡 说明

本数据包使用 MaxKB Docker 版本（v2.3.0），所有数据通过 Docker Volume 挂载，不需要：
- ❌ .sql 备份文件
- ❌ .env 配置文件
- ❌ uploads/media 目录

所有配置、数据库、文件都已包含在 data 目录中！

---

如有问题，请联系提供数据包的人。
