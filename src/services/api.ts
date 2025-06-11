import axios from 'axios';
import type {
  HealthResponse,
  SystemStatus,
  MCPConfig,
  MCPConfigCreate,
  LLMConfig,
  LLMConfigCreate,
  DataDocument,
  DataDocumentCreate,
  ChatRequest,
  ChatResponse,
} from '@/types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ 请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API响应: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ 响应错误:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 系统状态API
export const systemAPI = {
  getHealth: () => api.get<HealthResponse>('/health'),
  getStatus: () => api.get<SystemStatus>('/status'),
};

// MCP配置API
export const mcpAPI = {
  getConfigs: () => api.get<MCPConfig[]>('/mcp/configs'),
  createConfig: (data: MCPConfigCreate) => api.post<MCPConfig>('/mcp/configs', data),
  updateConfig: (id: string, data: Partial<MCPConfigCreate>) => 
    api.put<MCPConfig>(`/mcp/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/mcp/configs/${id}`),
  testConfig: (id: string) => api.post(`/mcp/configs/${id}/test`),
};

// LLM配置API
export const llmAPI = {
  getConfigs: () => api.get<LLMConfig[]>('/llm/configs'),
  createConfig: (data: LLMConfigCreate) => api.post<LLMConfig>('/llm/configs', data),
  updateConfig: (id: string, data: Partial<LLMConfigCreate>) => 
    api.put<LLMConfig>(`/llm/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/llm/configs/${id}`),
  testConfig: (id: string) => api.post(`/llm/configs/${id}/test`),
};

// 数据管理API
export const dataAPI = {
  getDocuments: (params?: any) => api.get<{ documents: DataDocument[]; total: number }>('/data/documents', { params }),
  createDocument: (data: DataDocumentCreate) => api.post<DataDocument>('/data/documents', data),
  updateDocument: (id: string, data: Partial<DataDocumentCreate>) => 
    api.put<DataDocument>(`/data/documents/${id}`, data),
  deleteDocument: (id: string) => api.delete(`/data/documents/${id}`),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ image_data: string; filename: string; mimetype: string }>('/data/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  searchDocuments: (q: string, limit?: number) => 
    api.get<{ results: DataDocument[] }>('/data/documents/search', { params: { q, limit } }),
  getStatistics: () => api.get('/data/statistics'),
};

// 聊天API
export const chatAPI = {
  sendMessage: (data: ChatRequest) => api.post<ChatResponse>('/chat/text', data),
  sendStreamMessage: (data: ChatRequest) => api.post('/chat/stream', data, {
    responseType: 'stream',
  }),
};

export default api;