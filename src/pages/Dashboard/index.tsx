// 更新Dashboard页面，添加快速操作链接
import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Spin, Button } from 'antd';
import {
  ToolOutlined,
  RobotOutlined,
  DatabaseOutlined,
  MessageOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { systemAPI, mcpAPI, llmAPI, dataAPI } from '@/services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    systemStatus,
    mcpConfigs,
    llmConfigs,
    dataDocuments,
    isLoading,
    setMCPConfigs,
    setLLMConfigs,
    setDataDocuments,
    setLoading,
  } = useAppStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 并行获取所有数据
        const [mcpResponse, llmResponse, dataResponse] = await Promise.all([
          mcpAPI.getConfigs(),
          llmAPI.getConfigs(),
          dataAPI.getDocuments(),
        ]);
        
        setMCPConfigs(mcpResponse.data);
        setLLMConfigs(llmResponse.data);
        setDataDocuments(dataResponse.data.documents);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setMCPConfigs, setLLMConfigs, setDataDocuments, setLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const enabledMCPTools = mcpConfigs.filter(config => config.status === 'running').length;
  const enabledLLMModels = llmConfigs.filter(config => config.enabled).length;
  const totalDocuments = dataDocuments.length;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">仪表板</h1>
        <p className="text-gray-600">AI Agent 系统概览</p>
      </div>

      {!systemStatus && (
        <Alert
          message="系统连接异常"
          description="无法获取系统状态，请检查后端服务是否正常运行"
          type="warning"
          showIcon
          className="mb-6"
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="MCP工具"
              value={enabledMCPTools}
              suffix={`/ ${mcpConfigs.length}`}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Button 
              type="link" 
              icon={<ArrowRightOutlined />} 
              onClick={() => navigate('/mcp-config')}
              className="mt-2"
            >
              管理工具
            </Button>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="LLM模型"
              value={enabledLLMModels}
              suffix={`/ ${llmConfigs.length}`}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Button 
              type="link" 
              icon={<ArrowRightOutlined />} 
              onClick={() => navigate('/llm-config')}
              className="mt-2"
            >
              管理模型
            </Button>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="数据文档"
              value={totalDocuments}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Button 
              type="link" 
              icon={<ArrowRightOutlined />} 
              onClick={() => navigate('/data-management')}
              className="mt-2"
            >
              管理数据
            </Button>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃会话"
              value={systemStatus?.active_sessions || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Button 
              type="link" 
              icon={<ArrowRightOutlined />} 
              onClick={() => navigate('/chat-test')}
              className="mt-2"
            >
              开始对话
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 系统指标 */}
      {systemStatus?.system_metrics && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="CPU使用率" size="small">
              <Progress
                percent={Math.round(systemStatus.system_metrics.cpu_percent)}
                status={systemStatus.system_metrics.cpu_percent > 80 ? 'exception' : 'normal'}
                strokeColor={{
                  from: '#108ee9',
                  to: '#87d068',
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title="内存使用率" size="small">
              <Progress
                percent={Math.round(systemStatus.system_metrics.memory_percent)}
                status={systemStatus.system_metrics.memory_percent > 85 ? 'exception' : 'normal'}
                strokeColor={{
                  from: '#108ee9',
                  to: '#87d068',
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title="磁盘使用率" size="small">
              <Progress
                percent={Math.round(systemStatus.system_metrics.disk_percent)}
                status={systemStatus.system_metrics.disk_percent > 90 ? 'exception' : 'normal'}
                strokeColor={{
                  from: '#108ee9',
                  to: '#87d068',
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 快速操作和最近活动 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="快速操作" size="small">
            <div className="space-y-2">
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                block 
                onClick={() => navigate('/mcp-config')}
              >
                创建MCP工具
              </Button>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                block 
                onClick={() => navigate('/llm-config')}
              >
                添加LLM模型
              </Button>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                block 
                onClick={() => navigate('/data-management')}
              >
                创建数据文档
              </Button>
              <Button 
                type="primary" 
                icon={<MessageOutlined />} 
                block 
                onClick={() => navigate('/chat-test')}
              >
                开始对话测试
              </Button>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="最近的MCP工具" size="small">
            {mcpConfigs.length > 0 ? (
              <div className="space-y-2">
                {mcpConfigs.slice(0, 5).map((config) => (
                  <div key={config.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{config.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      config.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {config.status === 'running' ? '运行中' : '已停止'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">暂无MCP工具配置</p>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="最近的数据文档" size="small">
            {dataDocuments.length > 0 ? (
              <div className="space-y-2">
                {dataDocuments.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{doc.name}</span>
                    <span className="text-xs text-gray-500">
                      {doc.data_list.length} 项数据
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">暂无数据文档</p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;