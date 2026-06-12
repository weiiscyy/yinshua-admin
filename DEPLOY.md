# 部署指南

## 环境配置

所有敏感配置通过 `.env` 文件管理，**不要提交到 Git**。

### 前端 (yinshua-admin)

```bash
# 开发环境
cp .env.example .env
# 编辑 .env 中的 VITE_API_BASE 为本机后端地址

# 生产环境（Docker）
# docker-compose.yml 中通过 environment 注入
```

### 后端 (yinshua-api-node)

```bash
# 开发环境
cp .env.example .env
# 编辑 .env 中的 DB_SERVER 为本机数据库地址

# 生产环境（Docker）
# docker-compose.yml 中通过 environment 注入
```

## 开发流程

```
1. 本机改代码
2. 测试通过
3. git add . && git commit -m "描述"
4. git push
5. 在 NAS 上: git pull && docker-compose build && docker-compose up -d
```

## Docker 部署（NAS）

```bash
cd /volume1/docker/yinshua

# 重新构建并启动
docker-compose build --no-cache
docker-compose down
docker-compose up -d

# 查看日志
docker logs -f yinshua-backend-1
docker logs -f yinshua-frontend-1
```

## 数据库问题排查

如果出现 "database is read-only"：
```sql
-- 在数据库服务器上执行
ALTER DATABASE yinshua SET READ_WRITE WITH ROLLBACK IMMEDIATE;
```

## 常见问题

- 前端 404 /api/api/... → 检查 src/api/index.js 中路径是否有多余的 /api 前缀
- 数据库连接失败 → 检查 DB_SERVER IP 是否正确、端口是否通
