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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppStore } from '@/stores/useAppStore';
import { mcpAPI } from '@/services/api';
import type { MCPConfig, MCPConfigCreate } from '@/types';

const { TextArea } = Input;
const { Option } = Select;

const MCPConfigPage: React.FC = () => {
  const { mcpConfigs, setMCPConfigs, addMCPConfig, updateMCPConfig, removeMCPConfig } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MCPConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<MCPConfig | null>(null);
  const [form] = Form.useForm();

  // 加载数据
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await mcpAPI.getConfigs();
      setMCPConfigs(response.data);
    } catch (error) {
      message.error('获取MCP配置失败');
      console.error('获取MCP配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (config: MCPConfig) => {
    setEditingConfig(config);
    form.setFieldsValue({
      ...config,
      args: config.args.join('\n'),
      env: Object.entries(config.env).map(([key, value]) => `${key}=${value}`).join('\n'),
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData: MCPConfigCreate = {
        ...values,
        args: values.args ? values.args.split('\n').filter((arg: string) => arg.trim()) : [],
        env: values.env
          ? Object.fromEntries(
              values.env
                .split('\n')
                .filter((line: string) => line.trim() && line.includes('='))
                .map((line: string) => {
                  const [key, ...valueParts] = line.split('=');
                  return [key.trim(), valueParts.join('=').trim()];
                })
            )
          : {},
      };

      if (editingConfig) {
        const response = await mcpAPI.updateConfig(editingConfig.id, submitData);
        updateMCPConfig(editingConfig.id, response.data);
        message.success('MCP配置更新成功');
      } else {
        const response = await mcpAPI.createConfig(submitData);
        addMCPConfig(response.data);
        message.success('MCP配置创建成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '操作失败');
      console.error('提交MCP配置失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mcpAPI.deleteConfig(id);
      removeMCPConfig(id);
      message.success('MCP配置删除成功');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
      console.error('删除MCP配置失败:', error);
    }
  };

  const handleTest = async (id: string) => {
    try {
      await mcpAPI.testConfig(id);
      message.success('MCP工具测试成功');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '测试失败');
      console.error('测试MCP配置失败:', error);
    }
  };

  const showDetail = (config: MCPConfig) => {
    setSelectedConfig(config);
    setDetailDrawerVisible(true);
  };

  const columns: ColumnsType<MCPConfig> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => showDetail(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command',
      render: (text) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code>,
    },
    {
      title: '传输方式',
      dataIndex: 'transport',
      key: 'transport',
      render: (transport) => (
        <Tag color={transport === 'stdio' ? 'blue' : transport === 'websocket' ? 'green' : 'orange'}>
          {transport.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'running' ? 'green' : status === 'stopped' ? 'red' : 'orange'}>
          {status === 'running' ? '运行中' : status === 'stopped' ? '已停止' : '未知'}
        </Tag>
      ),
    },
    {
      title: '自动启动',
      dataIndex: 'auto_start',
      key: 'auto_start',
      render: (autoStart) => (
        <Tag color={autoStart ? 'green' : 'default'}>
          {autoStart ? '是' : '否'}
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
          <Tooltip title="编辑">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个MCP配置吗？"
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
          <h1 className="text-2xl font-bold text-gray-800">MCP工具配置</h1>
          <p className="text-gray-600">管理Model Context Protocol工具配置</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建MCP配置
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={mcpConfigs}
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
        title={editingConfig ? '编辑MCP配置' : '新建MCP配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            transport: 'stdio',
            auto_start: false,
            restart_on_failure: true,
            timeout: 30,
          }}
        >
          <Form.Item
            label="工具名称"
            name="name"
            rules={[{ required: true, message: '请输入工具名称' }]}
          >
            <Input placeholder="请输入工具名称" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={2} placeholder="请输入工具描述" />
          </Form.Item>

          <Form.Item
            label="启动命令"
            name="command"
            rules={[{ required: true, message: '请输入启动命令' }]}
          >
            <Input placeholder="例如: python" />
          </Form.Item>

          <Form.Item label="命令参数" name="args">
            <TextArea
              rows={3}
              placeholder="每行一个参数，例如:&#10;tools/math_server.py&#10;--port&#10;8080"
            />
          </Form.Item>

          <Form.Item label="环境变量" name="env">
            <TextArea
              rows={3}
              placeholder="每行一个环境变量，格式: KEY=VALUE&#10;例如:&#10;MODEL_PATH=/path/to/model&#10;DEBUG=true"
            />
          </Form.Item>

          <Form.Item
            label="传输方式"
            name="transport"
            rules={[{ required: true, message: '请选择传输方式' }]}
          >
            <Select>
              <Option value="stdio">STDIO</Option>
              <Option value="websocket">WebSocket</Option>
              <Option value="http">HTTP</Option>
            </Select>
          </Form.Item>

          <Form.Item label="版本" name="version">
            <Input placeholder="工具版本号" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="自动启动" name="auto_start" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item label="失败重启" name="restart_on_failure" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <Form.Item
            label="超时时间(秒)"
            name="timeout"
            rules={[{ required: true, message: '请输入超时时间' }]}
          >
            <InputNumber min={1} max={300} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="MCP配置详情"
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
                <div><strong>名称:</strong> {selectedConfig.name}</div>
                <div><strong>描述:</strong> {selectedConfig.description || '无'}</div>
                <div><strong>版本:</strong> {selectedConfig.version || '未指定'}</div>
                <div><strong>状态:</strong> 
                  <Tag color={selectedConfig.status === 'running' ? 'green' : 'red'} className="ml-2">
                    {selectedConfig.status === 'running' ? '运行中' : '已停止'}
                  </Tag>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">运行配置</h3>
              <div className="mt-2 space-y-2">
                <div><strong>启动命令:</strong> <code>{selectedConfig.command}</code></div>
                <div><strong>传输方式:</strong> {selectedConfig.transport.toUpperCase()}</div>
                <div><strong>超时时间:</strong> {selectedConfig.timeout}秒</div>
                <div><strong>自动启动:</strong> {selectedConfig.auto_start ? '是' : '否'}</div>
                <div><strong>失败重启:</strong> {selectedConfig.restart_on_failure ? '是' : '否'}</div>
              </div>
            </div>

            {selectedConfig.args.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800">命令参数</h3>
                <div className="mt-2 bg-gray-50 p-3 rounded">
                  {selectedConfig.args.map((arg, index) => (
                    <div key={index} className="font-mono text-sm">{arg}</div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(selectedConfig.env).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800">环境变量</h3>
                <div className="mt-2 bg-gray-50 p-3 rounded">
                  {Object.entries(selectedConfig.env).map(([key, value]) => (
                    <div key={key} className="font-mono text-sm">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-800">时间信息</h3>
              <div className="mt-2 space-y-2">
                <div><strong>创建时间:</strong> {new Date(selectedConfig.created_at).toLocaleString()}</div>
                <div><strong>更新时间:</strong> {new Date(selectedConfig.updated_at).toLocaleString()}</div>
              </div>
            </div>

            {selectedConfig.last_error && (
              <div>
                <h3 className="font-semibold text-red-600">最近错误</h3>
                <div className="mt-2 bg-red-50 p-3 rounded text-red-700">
                  {selectedConfig.last_error}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MCPConfigPage;