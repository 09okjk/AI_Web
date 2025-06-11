import React, { useEffect } from 'react';
import { Layout, Menu, theme, Breadcrumb, Spin, Alert } from 'antd';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  ToolOutlined,
  RobotOutlined,
  DatabaseOutlined,
  MessageOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores/useAppStore';
import { systemAPI } from '@/services/api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '仪表板',
  },
  {
    key: '/mcp-config',
    icon: <ToolOutlined />,
    label: 'MCP工具配置',
  },
  {
    key: '/llm-config',
    icon: <RobotOutlined />,
    label: 'LLM模型配置',
  },
  {
    key: '/data-management',
    icon: <DatabaseOutlined />,
    label: '数据管理',
  },
  {
    key: '/chat-test',
    icon: <MessageOutlined />,
    label: '问答测试',
  },
];

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { systemStatus, isLoading, setSystemStatus, setLoading } = useAppStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 获取系统状态
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        const response = await systemAPI.getStatus();
        setSystemStatus(response.data);
      } catch (error) {
        console.error('获取系统状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
    
    // 每30秒刷新一次系统状态
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [setSystemStatus, setLoading]);

  const getBreadcrumbItems = () => {
    const pathMap: Record<string, string> = {
      '/': '仪表板',
      '/mcp-config': 'MCP工具配置',
      '/llm-config': 'LLM模型配置',
      '/data-management': '数据管理',
      '/chat-test': '问答测试',
    };

    return [
      { title: 'AI Agent' },
      { title: pathMap[location.pathname] || '未知页面' },
    ];
  };

  return (
    <Layout className="min-h-screen">
      <Sider width={250} style={{ background: colorBgContainer }}>
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold text-blue-600">AI Agent 控制台</h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ background: colorBgContainer, padding: '0 24px' }}>
          <div className="flex justify-between items-center h-full">
            <Breadcrumb items={getBreadcrumbItems()} />
            
            <div className="flex items-center space-x-4">
              {isLoading && <Spin size="small" />}
              {systemStatus && (
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      systemStatus.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    活跃会话: {systemStatus.active_sessions}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Header>
        
        <Content style={{ margin: '16px', padding: '24px', background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {!systemStatus && !isLoading && (
            <Alert
              message="系统状态获取失败"
              description="无法连接到后端服务，请检查服务器状态"
              type="error"
              showIcon
              className="mb-4"
            />
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;