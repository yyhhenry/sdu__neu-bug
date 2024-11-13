# neu-bug

SDU 专业实训项目。

## 使用方法

你需要先安装 Node.js 和 pnpm。我们推荐使用 Node.js 的长期支持版本（LTS）。在 Windows 上，你可以尝试运行 `scoop install nodejs-lts pnpm` 来安装。

```sh
# 安装项目依赖
pnpm i
# 启动开发服务器
pnpm dev

# 检查代码
pnpm lint
# 格式化代码
pnpm fmt
# 类型检查
pnpm type-check

# 构建生产环境下的应用
pnpm build
# 预览构建后的生产环境应用
pnpm preview
```
