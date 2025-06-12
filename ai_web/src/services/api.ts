import axios from 'axios'

// API基础配置
const API_BASE_URL = 'http://localhost:8000' // 根据您的后端地址调整

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 数据项内容接口
export interface DataItemContent {
  sequence: number
  text: string
  image?: string // base64编码
  image_filename?: string
  image_mimetype?: string
}

// 数据文档接口
export interface DataDocument {
  id?: string
  name: string
  description?: string
  data_list: DataItemContent[]
  tags: string[]
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  version?: number
}

// 数据文档列表响应接口
export interface DataDocumentListResponse {
  success: boolean
  documents: DataDocument[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// API服务类
export class DataService {
  // 创建数据文档
  static async createDocument(document: Omit<DataDocument, 'id'>): Promise<DataDocument> {
    const response = await api.post('/api/data/documents', document)
    return response.data
  }

  // 获取数据文档
  static async getDocument(documentId: string): Promise<DataDocument> {
    const response = await api.get(`/api/data/documents/${documentId}`)
    return response.data
  }

  // 更新数据文档
  static async updateDocument(documentId: string, updateData: Partial<DataDocument>): Promise<DataDocument> {
    const response = await api.put(`/api/data/documents/${documentId}`, updateData)
    return response.data
  }

  // 删除数据文档
  static async deleteDocument(documentId: string): Promise<{ message: string; success: boolean }> {
    const response = await api.delete(`/api/data/documents/${documentId}`)
    return response.data
  }

  // 获取数据文档列表
  static async listDocuments(params?: {
    name?: string
    tags?: string
    page?: number
    page_size?: number
    sort_by?: string
    sort_order?: number
  }): Promise<DataDocumentListResponse> {
    const response = await api.get('/api/data/documents', { params })
    return response.data
  }

  // 搜索数据文档
  static async searchDocuments(q: string, limit?: number): Promise<{
    success: boolean
    results: DataDocument[]
    total_matches: number
    search_time: number
  }> {
    const response = await api.get('/api/data/documents/search', {
      params: { q, limit }
    })
    return response.data
  }

  // 上传图片
  static async uploadImage(file: File): Promise<{
    success: boolean
    message: string
    image_data: string
    filename: string
    mimetype: string
    size: number
  }> {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await api.post('/api/data/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  // 向文档添加数据项
  static async addDataItem(documentId: string, item: DataItemContent): Promise<{ message: string; success: boolean }> {
    const response = await api.post(`/api/data/documents/${documentId}/items`, item)
    return response.data
  }

  // 更新数据项
  static async updateDataItem(documentId: string, sequence: number, item: DataItemContent): Promise<{ message: string; success: boolean }> {
    const response = await api.put(`/api/data/documents/${documentId}/items/${sequence}`, item)
    return response.data
  }

  // 删除数据项
  static async deleteDataItem(documentId: string, sequence: number): Promise<{ message: string; success: boolean }> {
    const response = await api.delete(`/api/data/documents/${documentId}/items/${sequence}`)
    return response.data
  }
}