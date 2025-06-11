#!/bin/bash

echo "🚀 启动AI Agent前端项目..."

# 检查Node.js版本
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未安装Node.js"
    echo "请访问 https://nodejs.org/ 下载安装Node.js"
    exit 1
fi

echo "✅ Node.js版本: $node_version"

# 检查是否存在package.json
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到package.json文件"
    echo "请确保在项目根目录下运行此脚本"
    exit 1
fi

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查后端服务是否运行
echo "🔍 检查后端服务..."
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health 2>/dev/null)

if [ "$backend_status" != "200" ]; then
    echo "⚠️  警告: 后端服务似乎未运行 (localhost:8000)"
    echo "   请确保AI Agent后端服务已启动"
    echo "   启动命令: python start_server.py"
    echo ""
fi

# 启动开发服务器
echo "🌐 启动前端开发服务器..."
echo "📍 地址: http://localhost:3000"
echo "🔗 API代理: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev