#!/bin/bash

echo "🚀 创建AI Agent前端项目..."

# 创建项目目录
mkdir ai-agent-frontend
cd ai-agent-frontend

# 使用Vite创建React TypeScript项目
npm create vite@latest . -- --template react-ts

# 安装依赖
npm install

# 安装额外依赖
npm install \
  antd \
  @ant-design/icons \
  react-router-dom \
  axios \
  zustand \
  tailwindcss \
  autoprefixer \
  postcss \
  @types/node

# 安装开发依赖
npm install -D \
  @types/react-router-dom \
  eslint-plugin-react-hooks \
  prettier

# 初始化Tailwind CSS
npx tailwindcss init -p

echo "✅ 项目创建完成！"
echo "📁 进入目录: cd ai-agent-frontend"
echo "🚀 启动开发服务器: npm run dev"