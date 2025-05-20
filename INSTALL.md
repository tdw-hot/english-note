# 英语语法笔记 - 安装指南

## 系统要求

- Node.js: 16.x 或更高版本
- npm: 7.x 或更高版本

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/tdw-hot/english-note.git
cd english-note
```

### 2. 安装依赖

```bash
npm install
```

### 3. 本地开发

启动开发服务器：

```bash
npm run docs:dev
```

然后在浏览器中访问 http://localhost:8080/english-note/ 查看网站。

### 4. 构建生产版本

```bash
npm run docs:build
```

构建完成后，静态文件会生成在 `docs/.vuepress/dist` 目录下。

## 常见问题

### 安装依赖时出错

如果安装依赖时出现错误，可以尝试以下解决方案：

1. 清除npm缓存：
   ```bash
   npm cache clean --force
   ```

2. 使用Node.js版本管理工具（如nvm）安装合适的Node.js版本：
   ```bash
   nvm install 16
   nvm use 16
   ```

3. 重新安装依赖：
   ```bash
   rm -rf node_modules
   npm install
   ```

### 本地开发服务器启动失败

如果出现端口占用错误，可以尝试修改VuePress配置来使用不同的端口。在 `docs/.vuepress/config.js` 中添加：

```js
// ...
export default defineUserConfig({
  // ...
  port: 8081, // 或其他未被占用的端口
  // ...
})
```

## 部署

项目已配置GitHub Actions自动部署。当你推送代码到master分支时，网站会自动构建并部署到GitHub Pages。

如果需要手动部署，可以运行：

```bash
npm run docs:build
```

然后将`docs/.vuepress/dist`目录下的文件部署到您的Web服务器或静态网站托管服务上。 