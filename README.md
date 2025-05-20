# English Note

本项目是一个使用 VuePress 构建的英语语法笔记网站。

## 环境要求

请确保您的开发环境中已安装以下软件：

*   [Node.js](https://nodejs.org/) (建议版本 18.x 或更高版本，与 GitHub Actions 工作流中使用的版本一致)
*   npm (通常随 Node.js 一同安装)

## 本地开发

1.  **克隆项目** (如果您尚未克隆):
    ```bash
    git clone https://github.com/your-username/english-note.git
    cd english-note
    ```

2.  **安装依赖**:
    在项目根目录下运行以下命令安装项目所需的依赖包。
    ```bash
    npm install
    ```

3.  **启动本地开发服务器**:
    运行以下命令启动 VuePress 的本地开发服务器。
    ```bash
    npm run docs:dev
    ```
    命令执行成功后，您可以在浏览器中访问 `http://localhost:8080` (或控制台输出的实际端口号) 查看效果。

## 构建项目

如果您需要手动构建项目的静态文件，可以运行以下命令：

```bash
npm run docs:build
```

构建完成后，静态文件将生成在 `docs/.vuepress/dist/` 目录下。

## 部署

本项目配置了 GitHub Actions 工作流，可以在代码推送到 `master` 分支时自动构建并将站点部署到 GitHub Pages。

### 自动化部署 (推荐)

1.  **推送代码**:
    将您的本地更改提交并推送到 GitHub 仓库的 `master` 分支。
    ```bash
    git add .
    git commit -m "Your commit message"
    git push origin master
    ```

2.  **GitHub Actions**:
    GitHub Actions 会自动检测到 `master` 分支的更新，并触发 `.github/workflows/docs.yml` 中定义的工作流。
    该工作流会执行以下操作：
    *   检出代码。
    *   设置 Node.js 环境 (版本 18.x)。
    *   使用 `npm ci` 安装依赖。
    *   使用 `npm run docs:build` 构建站点。
    *   将 `docs/.vuepress/dist/` 目录中的内容部署到 `gh-pages` 分支。

3.  **配置 GitHub Pages**:
    *   在您的 GitHub 仓库中，进入 "Settings" -> "Pages"。
    *   在 "Build and deployment" 下的 "Source" 部分，选择 "Deploy from a branch"。
    *   在 "Branch" 部分，选择 `gh-pages` 分支，并保持路径为 `/ (root)`。
    *   点击 "Save"。

    配置完成后，您的站点将通过 `https://<your-username>.github.io/english-note/` (或您仓库配置的自定义域名) 访问。请注意，`base` 路径在 `docs/.vuepress/config.js` 中已设置为 `/english-note/`。

### 手动部署

如果您希望手动部署，可以将 `docs/.vuepress/dist/` 目录下的所有文件上传到您选择的静态网站托管服务。

## 贡献

欢迎对本项目做出贡献！如果您有任何建议或发现错误，请随时提交 Pull Request 或创建 Issue。

## 许可证

[MIT](LICENSE) 