// 系统状态相关
export interface HealthResponse {
  success: boolean;
  status: string;
  timestamp: string;
  version: string;
  components: Record<string, any>;
}

export interface SystemStatus {
  success: boolean;
  timestamp: string;
  uptime: string;
  mcp_tools: Record<string, any>;
  llm_models: Record<string, any>;
  active_sessions: number;
  system_metrics: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
}

// MCP配置相关
export interface MCPConfig {
  id: string;
  name: string;
  description?: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  transport: 'stdio' | 'websocket' | 'http';
  version?: string;
  auto_start: boolean;
  restart_on_failure: boolean;
  timeout: number;
  status: string;
  created_at: string;
  updated_at: string;
  last_error?: string;
}

export interface MCPConfigCreate {
  name: string;
  description?: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  transport: 'stdio' | 'websocket' | 'http';
  version?: string;
  auto_start: boolean;
  restart_on_failure: boolean;
  timeout: number;
}

// LLM配置相关
export interface LLMConfig {
  id: string;
  name: string;
  provider: 'dashscope' | 'xinference' | 'openai' | 'anthropic' | 'local';
  model_name: string;
  api_key?: string;
  base_url?: string;
  max_tokens?: number;
  temperature: number;
  top_p: number;
  system_prompt?: string;
  is_default: boolean;
  enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  last_used?: string;
}

export interface LLMConfigCreate {
  name: string;
  provider: 'dashscope' | 'xinference' | 'openai' | 'anthropic' | 'local';
  model_name: string;
  api_key?: string;
  base_url?: string;
  max_tokens?: number;
  temperature: number;
  top_p: number;
  system_prompt?: string;
  is_default: boolean;
  enabled: boolean;
}

// 数据管理相关
export interface DataItemContent {
  sequence: number;
  text: string;
  image?: string;
  image_filename?: string;
  image_mimetype?: string;
}

export interface DataDocument {
  id: string;
  name: string;
  description?: string;
  data_list: DataItemContent[];
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface DataDocumentCreate {
  name: string;
  description?: string;
  data_list: DataItemContent[];
  tags: string[];
  metadata: Record<string, any>;
}

// 聊天相关
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  model_name?: string;
  system_prompt?: string;
  session_id?: string;
  stream?: boolean;
  tools?: string[];
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  success: boolean;
  content: string;
  model_name: string;
  session_id: string;
  tools_used: string[];
  processing_time: number;
  token_usage: Record<string, number>;
}