import { create } from 'zustand';
import type { MCPConfig, LLMConfig, DataDocument, SystemStatus } from '@/types';

interface AppState {
  // 系统状态
  systemStatus: SystemStatus | null;
  isLoading: boolean;
  
  // MCP配置
  mcpConfigs: MCPConfig[];
  
  // LLM配置
  llmConfigs: LLMConfig[];
  
  // 数据文档
  dataDocuments: DataDocument[];
  
  // 操作方法
  setSystemStatus: (status: SystemStatus | null) => void;
  setLoading: (loading: boolean) => void;
  setMCPConfigs: (configs: MCPConfig[]) => void;
  setLLMConfigs: (configs: LLMConfig[]) => void;
  setDataDocuments: (documents: DataDocument[]) => void;
  
  // 添加/更新/删除方法
  addMCPConfig: (config: MCPConfig) => void;
  updateMCPConfig: (id: string, config: Partial<MCPConfig>) => void;
  removeMCPConfig: (id: string) => void;
  
  addLLMConfig: (config: LLMConfig) => void;
  updateLLMConfig: (id: string, config: Partial<LLMConfig>) => void;
  removeLLMConfig: (id: string) => void;
  
  addDataDocument: (document: DataDocument) => void;
  updateDataDocument: (id: string, document: Partial<DataDocument>) => void;
  removeDataDocument: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  systemStatus: null,
  isLoading: false,
  mcpConfigs: [],
  llmConfigs: [],
  dataDocuments: [],
  
  // 基础设置方法
  setSystemStatus: (status) => set({ systemStatus: status }),
  setLoading: (loading) => set({ isLoading: loading }),
  setMCPConfigs: (configs) => set({ mcpConfigs: configs }),
  setLLMConfigs: (configs) => set({ llmConfigs: configs }),
  setDataDocuments: (documents) => set({ dataDocuments: documents }),
  
  // MCP配置管理
  addMCPConfig: (config) => 
    set((state) => ({ mcpConfigs: [...state.mcpConfigs, config] })),
  
  updateMCPConfig: (id, updates) =>
    set((state) => ({
      mcpConfigs: state.mcpConfigs.map((config) =>
        config.id === id ? { ...config, ...updates } : config
      ),
    })),
  
  removeMCPConfig: (id) =>
    set((state) => ({
      mcpConfigs: state.mcpConfigs.filter((config) => config.id !== id),
    })),
  
  // LLM配置管理
  addLLMConfig: (config) =>
    set((state) => ({ llmConfigs: [...state.llmConfigs, config] })),
  
  updateLLMConfig: (id, updates) =>
    set((state) => ({
      llmConfigs: state.llmConfigs.map((config) =>
        config.id === id ? { ...config, ...updates } : config
      ),
    })),
  
  removeLLMConfig: (id) =>
    set((state) => ({
      llmConfigs: state.llmConfigs.filter((config) => config.id !== id),
    })),
  
  // 数据文档管理
  addDataDocument: (document) =>
    set((state) => ({ dataDocuments: [...state.dataDocuments, document] })),
  
  updateDataDocument: (id, updates) =>
    set((state) => ({
      dataDocuments: state.dataDocuments.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    })),
  
  removeDataDocument: (id) =>
    set((state) => ({
      dataDocuments: state.dataDocuments.filter((doc) => doc.id !== id),
    })),
}));