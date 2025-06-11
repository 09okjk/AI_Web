# AI Agent 前端项目

一个现代化的React应用，用于管理和配置AI Agent系统。

## 功能特性

- 🎛️ **系统仪表板** - 实时监控系统状态和关键指标
- 🔧 **MCP工具配置** - 管理Model Context Protocol工具
- 🤖 **LLM模型配置** - 配置和管理大语言模型
- 📄 **数据管理** - 创建和管理图文混合数据文档
- 💬 **问答测试** - 测试LLM模型的对话能力

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design 5.x
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **路由管理**: React Router v6
- **样式方案**: Tailwind CSS + Ant Design

## 快速开始

### 1. 环境要求

- Node.js 16.0+
- npm 或 yarn
- AI Agent后端服务运行在 localhost:8000

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
# 使用启动脚本（推荐）
./start-frontend.sh

# 或直接启动
npm run dev
```

### 4. 访问应用

打开浏览器访问: [http://localhost:5173](http://localhost:5173)

#### 项目结构

```Code
src/
├── components/          # 通用组件
│   └── Layout/         # 布局组件
├── pages/              # 页面组件
│   ├── Dashboard/      # 仪表板
│   ├── MCPConfig/      # MCP工具配置
│   ├── LLMConfig/      # LLM模型配置
│   ├── DataManagement/ # 数据管理
│   └── ChatTest/       # 问答测试
├── services/           # API服务
├── stores/             # 状态管理
├── types/              # TypeScript类型
└── utils/              # 工具函数
```

#### 功能说明

系统仪表板

- 实时显示系统运行状态
- 监控CPU、内存、磁盘使用率
- 显示活跃工具和模型数量
- 提供快速操作入口

MCP工具配置

- 创建和管理MCP工具配置
- 支持不同传输方式（STDIO、WebSocket、HTTP）
- 实时监控工具运行状态
- 测试工具连接性

LLM模型配置

- 支持多种LLM提供商
- 配置模型参数（温度、Top-P等）
- 设置系统提示词
- 测试模型可用性

数据管理

- 创建图文混合数据文档
- 支持图片上传和base64编码
- 步骤式数据录入界面
- 文档搜索和预览功能

问答测试

- 测试LLM模型对话能力
- 实时调整模型参数
- 支持预设问题快速测试
- 对话历史管理

#### 开发指南

添加新页面

1. 在 src/pages/ 下创建新页面组件
2. 在 src/App.tsx 中添加路由
3. 在 src/components/Layout/MainLayout.tsx 中添加菜单项

API调用

所有API调用都通过 src/services/api.ts 进行，包含：

- 自动错误处理
- 请求/响应拦截
- 类型安全的接口定义

#### 状态管理

使用Zustand进行状态管理，存储在 src/stores/useAppStore.ts：

- 系统状态
- 配置数据
- 用户交互状态

### 构建和部署

#### 开发构建

```bash
npm run build
```

#### 预览构建结果

```bash
npm run preview
```

#### 生产部署

```bash
# 构建生产版本
npm run build

# 部署到静态文件服务器
# 构建结果在 dist/ 目录
```

### 故障排除

#### 常见问题

1. 后端连接失败

    - 确保AI Agent后端服务运行在 localhost:8000
    - 检查CORS配置

2. 依赖安装失败

    - 清除缓存: npm cache clean --force
    - 删除node_modules重新安装

3. TypeScript错误

    - 运行类型检查: npm run type-check
    - 更新类型定义

#### 调试技巧

```bash
# 开启详细日志
npm run dev -- --debug

# 检查构建问题
npm run build -- --debug

# 分析打包大小
npm run build -- --report
```

### 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 许可证

MIT License
