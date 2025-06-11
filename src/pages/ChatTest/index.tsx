import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Select,
  Slider,
  Switch,
  message,
  Avatar,
  Spin,
  Empty,
  Tooltip,
  Tag,
  Collapse,
  Divider,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ClearOutlined,
  SettingOutlined,
  CopyOutlined,
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores/useAppStore';
import { chatAPI, llmAPI } from '@/services/api';
import type { ChatMessage, LLMConfig, ChatRequest } from '@/types';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const ChatTestPage: React.FC = () => {
  const { llmConfigs, setLLMConfigs } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [chatSettings, setChatSettings] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
    stream: false,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // 加载LLM配置
  useEffect(() => {
    const fetchLLMConfigs = async () => {
      try {
        const response = await llmAPI.getConfigs();
        const configs = response.data;
        setLLMConfigs(configs);
        
        // 自动选择默认模型
        const defaultModel = configs.find(config => config.is_default && config.enabled);
        if (defaultModel) {
          setSelectedModel(defaultModel.id);
        } else {
          const firstEnabled = configs.find(config => config.enabled);
          if (firstEnabled) {
            setSelectedModel(firstEnabled.id);
          }
        }
      } catch (error) {
        message.error('获取LLM配置失败');
      }
    };

    fetchLLMConfigs();
  }, [setLLMConfigs]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim()) {
      message.warning('请输入消息内容');
      return;
    }

    if (!selectedModel) {
      message.warning('请选择一个LLM模型');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const chatRequest: ChatRequest = {
        message: userMessage.content,
        model_name: selectedModel,
        session_id: sessionId,
        stream: chatSettings.stream,
        temperature: chatSettings.temperature,
        max_tokens: chatSettings.maxTokens,
        system_prompt: chatSettings.systemPrompt || undefined,
      };

      const response = await chatAPI.sendMessage(chatRequest);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.content,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // 聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
    } catch (error: any) {
      message.error(error.response?.data?.detail || '发送消息失败');
      
      // 添加错误消息
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '抱歉，我现在无法回复您的消息。请检查网络连接或稍后重试。',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空对话
  const clearMessages = () => {
    setMessages([]);
    message.success('对话已清空');
  };

  // 复制消息内容
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success('内容已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 重新生成回答
  const regenerateResponse = async (userMessage: string) => {
    if (!selectedModel) {
      message.warning('请选择一个LLM模型');
      return;
    }

    setIsLoading(true);

    try {
      const chatRequest: ChatRequest = {
        message: userMessage,
        model_name: selectedModel,
        session_id: sessionId,
        stream: chatSettings.stream,
        temperature: chatSettings.temperature,
        max_tokens: chatSettings.maxTokens,
        system_prompt: chatSettings.systemPrompt || undefined,
      };

      const response = await chatAPI.sendMessage(chatRequest);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.content,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      message.error(error.response?.data?.detail || '重新生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理按键事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 获取可用的LLM模型
  const availableModels = llmConfigs.filter(config => config.enabled);

  // 获取当前选中的模型信息
  const currentModel = llmConfigs.find(config => config.id === selectedModel);

  // 预设问题
  const presetQuestions = [
    "你好，请介绍一下你自己",
    "请解释一下什么是人工智能",
    "帮我写一个Python的Hello World程序",
    "今天天气怎么样？",
    "请推荐几本好书",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">问答测试</h1>
          <p className="text-gray-600">测试LLM模型的对话能力</p>
        </div>
        <Space>
          <Button icon={<ClearOutlined />} onClick={clearMessages}>
            清空对话
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧配置面板 */}
        <div className="col-span-3">
          <Card title="模型配置" size="small">
            <div className="space-y-4">
              {/* 模型选择 */}
              <div>
                <label className="block text-sm font-medium mb-2">选择模型</label>
                <Select
                  value={selectedModel}
                  onChange={setSelectedModel}
                  placeholder="请选择模型"
                  style={{ width: '100%' }}
                >
                  {availableModels.map(model => (
                    <Option key={model.id} value={model.id}>
                      <div className="flex items-center justify-between">
                        <span>{model.name}</span>
                        {model.is_default && <Tag color="gold" size="small">默认</Tag>}
                      </div>
                    </Option>
                  ))}
                </Select>
                {currentModel && (
                  <div className="mt-2 text-xs text-gray-500">
                    <div>提供商: {currentModel.provider.toUpperCase()}</div>
                    <div>模型: {currentModel.model_name}</div>
                  </div>
                )}
              </div>

              {/* 高级设置 */}
              <Collapse size="small" ghost>
                <Panel header="高级设置" key="1">
                  <div className="space-y-4">
                    {/* 温度参数 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        温度参数: {chatSettings.temperature}
                      </label>
                      <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        value={chatSettings.temperature}
                        onChange={(value) => setChatSettings(prev => ({ ...prev, temperature: value }))}
                      />
                    </div>

                    {/* 最大Token */}
                    <div>
                      <label className="block text-sm font-medium mb-2">最大Token数</label>
                      <Select
                        value={chatSettings.maxTokens}
                        onChange={(value) => setChatSettings(prev => ({ ...prev, maxTokens: value }))}
                        style={{ width: '100%' }}
                      >
                        <Option value={1000}>1000</Option>
                        <Option value={2000}>2000</Option>
                        <Option value={4000}>4000</Option>
                        <Option value={8000}>8000</Option>
                      </Select>
                    </div>

                    {/* 系统提示词 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">系统提示词</label>
                      <TextArea
                        value={chatSettings.systemPrompt}
                        onChange={(e) => setChatSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        placeholder="可选，设置模型行为"
                        rows={3}
                      />
                    </div>

                    {/* 流式输出 */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">流式输出</label>
                      <Switch
                        checked={chatSettings.stream}
                        onChange={(checked) => setChatSettings(prev => ({ ...prev, stream: checked }))}
                        size="small"
                      />
                    </div>
                  </div>
                </Panel>
              </Collapse>

              {/* 预设问题 */}
              <div>
                <label className="block text-sm font-medium mb-2">快速提问</label>
                <div className="space-y-2">
                  {presetQuestions.map((question, index) => (
                    <Button
                      key={index}
                      size="small"
                      block
                      onClick={() => setInputMessage(question)}
                      className="text-left"
                      disabled={isLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧对话区域 */}
        <div className="col-span-9">
          <Card className="h-[600px] flex flex-col">
            {/* 对话内容 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无对话记录，开始你的第一次对话吧！"
                  />
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar
                        icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        className={message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}
                      />
                      <div className={`rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        <div className={`text-xs mt-2 opacity-70 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                        
                        {/* 消息操作按钮 */}
                        <div className="flex space-x-2 mt-2">
                          <Tooltip title="复制">
                            <Button
                              size="small"
                              type="text"
                              icon={<CopyOutlined />}
                              onClick={() => copyMessage(message.content)}
                              className={message.role === 'user' ? 'text-blue-100 hover:text-white' : ''}
                            />
                          </Tooltip>
                          {message.role === 'assistant' && (
                            <Tooltip title="重新生成">
                              <Button
                                size="small"
                                type="text"
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                  const prevUserMessage = messages[index - 1];
                                  if (prevUserMessage && prevUserMessage.role === 'user') {
                                    regenerateResponse(prevUserMessage.content);
                                  }
                                }}
                                disabled={isLoading}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* 加载指示器 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex space-x-3">
                    <Avatar icon={<RobotOutlined />} className="bg-green-500" />
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Spin size="small" />
                      <span className="ml-2 text-gray-600">正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <TextArea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的问题... (Shift+Enter 换行, Enter 发送)"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim() || !selectedModel}
                  className="h-auto"
                >
                  发送
                </Button>
              </div>
              
              {/* 状态栏 */}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <div>
                  会话ID: {sessionId.slice(-8)}
                </div>
                <div>
                  消息数: {messages.length} | 模型: {currentModel?.name || '未选择'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatTestPage;