# 飞之翼刷题助手

基于 Tampermonkey 的浏览器脚本，支持飞之翼刷题快捷键操作和自动将题目内容保存到 Obsidian。

## 🧩 功能

- 快捷键答题（A/B/C 选项）
- 自动打开热门评论
- 一键发送题目内容到 Obsidian（使用 Advanced URI 插件）
- 自动复制 Markdown 格式到剪贴板

## 🔧 快捷键配置

- `q/w/e`: 选择 A/B/C
- `a/d`: 上一题 / 下一题
- `r`: 打开评论并切换为“最热”
- `z`: 保存当前题目到 Obsidian（评论打开前提下可保存第一条评论）
- `escape`: 关闭弹窗
- `s`: 放大题目图片

## 📂 Obsidian 设置

请在 Obsidian 中安装并启用 Advanced URI 插件，并根据脚本中的配置修改 Vault 名和文件名。

## 📎 安装方法

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 打开此脚本链接：[feizhiyi-helper.user.js](https://yourusername.github.io/your-repo-name/feizhiyi-helper.user.js)
3. 点击“安装”

## 📝 License

MIT
