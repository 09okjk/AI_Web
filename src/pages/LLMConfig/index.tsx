import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Space,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Drawer,
  Slider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppStore } from '@/stores/useAppStore';
import { llmAPI } from '@/services/api';
import type { LLMConfig, LLMConfigCreate } from '@/types';

const { TextArea } = Input;
const { Option } = Select;

const LLMConfigPage: React.FC = () => {
  const { llmConfigs, setLLMConfigs, addLLMConfig, updateLLMConfig, removeLLMConfig } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<LLMConfig | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await llmAPI.getConfigs();
      setLLMConfigs(response.data);
    } catch (error) {
      message.error('获取LLM配置失败');
      console.error('获取LLM配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (config: LLMConfig) => {
    setEditingConfig(config);
    form.setFieldsValue(config);
    setModalVisible(true);
  };

  const handleSubmit = async (values: LLMConfigCreate) => {
    try {
      if (editingConfig) {
        const response = await llmAPI.updateConfig(editingConfig.id, values);
        updateLLMConfig(editingConfig.id, response.data);
        message.success('LLM配置更新成功');
      } else {
        const response = await llmAPI.createConfig(values);
        addLLMConfig(response.data);
        message.success('LLM配置创建成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '操作失败');
      console.error('提交LLM配置失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await llmAPI.deleteConfig(id);
      removeLLMConfig(id);
      message.success('LLM配置删除成功');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
      console.error('删除LLM配置失败:', error);
    }
  };

  const handleTest = async (id: string) => {
    try {
      await llmAPI.testConfig(id);
      message.success('LLM模型测试成功');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '测试失败');
      console.error('测试LLM配置失败:', error);
    }
  };

  const showDetail = (config: LLMConfig) => {
    setSelectedConfig(config);
    setDetailDrawerVisible(true);
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      dashscope: 'blue',
      xinference: 'green', 
      openai: 'purple',
      anthropic: 'orange',
      local: 'gray',
    };
    return colors[provider] || 'default';
  };

  const columns: ColumnsType<LLMConfig> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center space-x-2">
          {record.is_default && <StarFilled className="text-yellow-500" />}
          <Button type="link" onClick={() => showDetail(record)}>
            {text}
          </Button>
        </div>
      ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider) => (
        <Tag color={getProviderColor(provider)}>
          {provider.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code>,
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (temp) => <span>{temp}</span>,
    },
    {
      title: 'Top P',
      dataIndex: 'top_p',
      key: 'top_p',
      render: (topP) => <span>{topP}</span>,
    },
    {
      title: '最大Token',
      dataIndex: 'max_tokens',
      key: 'max_tokens',
      render: (tokens) => tokens || '默认',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="测试">
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleTest(record.id)}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个LLM配置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">LLM模型配置</h1>
          <p className="text-gray-600">管理大语言模型配置和参数</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建LLM配置
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={llmConfigs}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingConfig ? '编辑LLM配置' : '新建LLM配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            provider: 'dashscope',
            temperature: 0.7,
            top_p: 0.9,
            is_default: false,
            enabled: true,
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="配置名称"
              name="name"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="请输入配置名称" />
            </Form.Item>

            <Form.Item
              label="提供商"
              name="provider"
              rules={[{ required: true, message: '请选择提供商' }]}
            >
              <Select>
                <Option value="dashscope">DashScope</Option>
                <Option value="xinference">Xinference</Option>
                <Option value="openai">OpenAI</Option>
                <Option value="anthropic">Anthropic</Option>
                <Option value="local">Local</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="模型名称"
            name="model_name"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="例如: qwen-plus, gpt-4, claude-3-sonnet" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="API密钥" name="api_key">
              <Input.Password placeholder="请输入API密钥" />
            </Form.Item>

            <Form.Item label="API基础URL" name="base_url">
              <Input placeholder="可选，自定义API地址" />
            </Form.Item>
          </div>

          <Form.Item label="系统提示词" name="system_prompt">
            <TextArea rows={3} placeholder="可选，设置模型的系统提示词" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label="最大Token数" name="max_tokens">
              <InputNumber min={1} max={32000} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>

            <Form.Item
              label="温度参数"
              name="temperature"
              rules={[{ required: true, message: '请设置温度参数' }]}
            >
              <Slider
                min={0}
                max={2}
                step={0.1}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </Form.Item>

            <Form.Item
              label="Top P"
              name="top_p"
              rules={[{ required: true, message: '请设置Top P参数' }]}
            >
              <Slider
                min={0}
                max={1}
                step={0.1}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="设为默认" name="is_default" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item label="启用配置" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="LLM配置详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={500}
      >
        {selectedConfig && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">基本信息</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <strong>名称:</strong> <span>{selectedConfig.name}</span>
                  {selectedConfig.is_default && <StarFilled className="text-yellow-500" />}
                </div>
                <div><strong>提供商:</strong> 
                  <Tag color={getProviderColor(selectedConfig.provider)} className="ml-2">
                    {selectedConfig.provider.toUpperCase()}
                  </Tag>
                </div>
                <div><strong>模型:</strong> <code>{selectedConfig.model_name}</code></div>
                <div><strong>状态:</strong> 
                  <Tag color={selectedConfig.enabled ? 'green' : 'red'} className="ml-2">
                    {selectedConfig.enabled ? '启用' : '禁用'}
                  </Tag>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">模型参数</h3>
              <div className="mt-2 space-y-2">
                <div><strong>温度参数:</strong> {selectedConfig.temperature}</div>
                <div><strong>Top P:</strong> {selectedConfig.top_p}</div>
                <div><strong>最大Token:</strong> {selectedConfig.max_tokens || '默认'}</div>
              </div>
            </div>

            {selectedConfig.base_url && (
              <div>
                <h3 className="font-semibold text-gray-800">连接配置</h3>
                <div className="mt-2">
                  <div><strong>API地址:</strong> {selectedConfig.base_url}</div>
                </div>
              </div>
            )}

            {selectedConfig.system_prompt && (
              <div>
                <h3 className="font-semibold text-gray-800">系统提示词</h3>
                <div className="mt-2 bg-gray-50 p-3 rounded">
                  {selectedConfig.system_prompt}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-800">时间信息</h3>
              <div className="mt-2 space-y-2">
                <div><strong>创建时间:</strong> {new Date(selectedConfig.created_at).toLocaleString()}</div>
                <div><strong>更新时间:</strong> {new Date(selectedConfig.updated_at).toLocaleString()}</div>
                {selectedConfig.last_used && (
                  <div><strong>最后使用:</strong> {new Date(selectedConfig.last_used).toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LLMConfigPage;