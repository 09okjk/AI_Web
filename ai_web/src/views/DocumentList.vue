<template>
    <div class="document-list">
      <!-- 页面头部 -->
      <div class="header">
        <h1>数据文档管理</h1>
        <div class="header-actions">
          <el-button type="primary" @click="createDocument">
            新建文档
          </el-button>
        </div>
      </div>
  
      <!-- 搜索和筛选 -->
      <div class="filters">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文档名称或内容..."
            style="width: 400px;"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch" :loading="searching">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        
        <div class="filter-controls">
          <el-select
            v-model="selectedTags"
            multiple
            placeholder="按标签筛选"
            style="width: 200px; margin-right: 16px;"
            @change="handleFilter"
          >
            <el-option
              v-for="tag in allTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
          
          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            style="width: 150px; margin-right: 16px;"
            @change="handleSort"
          >
            <el-option label="创建时间" value="created_at" />
            <el-option label="更新时间" value="updated_at" />
            <el-option label="名称" value="name" />
          </el-select>
          
          <el-button-group>
            <el-button
              :type="sortOrder === -1 ? 'primary' : 'default'"
              @click="toggleSortOrder"
            >
              降序
            </el-button>
            <el-button
              :type="sortOrder === 1 ? 'primary' : 'default'"
              @click="toggleSortOrder"
            >
              升序
            </el-button>
          </el-button-group>
        </div>
      </div>
  
      <!-- 文档列表 -->
      <div class="document-grid" v-loading="loading">
        <div
          v-for="document in documents"
          :key="document.id"
          class="document-card"
          @click="editDocument(document.id!)"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <h3 class="document-title">{{ document.name }}</h3>
            <div class="card-actions" @click.stop>
              <el-dropdown>
                <el-button type="text" size="small">
                  <i class="el-icon-more"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="editDocument(document.id!)">
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item @click="duplicateDocument(document)">
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item
                      @click="deleteDocument(document.id!, document.name)"
                      divided
                      style="color: #f56c6c;"
                    >
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
  
          <!-- 文档描述 -->
          <div class="document-description">
            {{ document.description || '暂无描述' }}
          </div>
  
          <!-- 节点预览 -->
          <div class="nodes-preview">
            <div class="nodes-count">
              {{ document.data_list.length }} 个节点
            </div>
            <div class="node-samples">
              <div
                v-for="(item, index) in document.data_list.slice(0, 3)"
                :key="item.sequence"
                class="node-sample"
              >
                <div class="node-number">{{ item.sequence }}</div>
                <div class="node-content">
                  <div v-if="item.image" class="has-image">🖼️</div>
                  <div class="node-text">
                    {{ item.text || '空文本' }}
                  </div>
                </div>
              </div>
              <div v-if="document.data_list.length > 3" class="more-nodes">
                +{{ document.data_list.length - 3 }} 更多
              </div>
            </div>
          </div>
  
          <!-- 标签 -->
          <div class="document-tags">
            <el-tag
              v-for="tag in document.tags.slice(0, 3)"
              :key="tag"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px;"
            >
              {{ tag }}
            </el-tag>
            <el-tag v-if="document.tags.length > 3" size="small" type="info">
              +{{ document.tags.length - 3 }}
            </el-tag>
          </div>
  
          <!-- 卡片底部信息 -->
          <div class="card-footer">
            <div class="document-stats">
              <span class="stat-item">
                <i class="el-icon-picture"></i>
                {{ document.data_list.filter(item => item.image).length }}
              </span>
              <span class="stat-item">
                <i class="el-icon-document"></i>
                {{ document.data_list.filter(item => item.text.trim()).length }}
              </span>
            </div>
            <div class="document-meta">
              <div class="update-time">
                {{ formatDate(document.updated_at!) }}
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 空状态 -->
      <div v-if="!loading && documents.length === 0" class="empty-state">
        <div class="empty-content">
          <i class="el-icon-document"></i>
          <h3>暂无数据文档</h3>
          <p>点击"新建文档"开始创建您的第一个数据文档</p>
          <el-button type="primary" @click="createDocument">
            新建文档
          </el-button>
        </div>
      </div>
  
      <!-- 分页 -->
      <div v-if="total > 0" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { DataService, type DataDocument } from '@/services/api'
  
  const router = useRouter()
  
  // 响应式数据
  const loading = ref(false)
  const searching = ref(false)
  const documents = ref<DataDocument[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  
  // 搜索和筛选
  const searchQuery = ref('')
  const selectedTags = ref<string[]>([])
  const sortBy = ref('created_at')
  const sortOrder = ref(-1)
  
  // 所有可用标签
  const allTags = computed(() => {
    const tagSet = new Set<string>()
    documents.value.forEach(doc => {
      doc.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })
  
  // 生命周期
  onMounted(() => {
    loadDocuments()
  })
  
  // 方法
  const loadDocuments = async () => {
    loading.value = true
    try {
      const params = {
        page: currentPage.value,
        page_size: pageSize.value,
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        tags: selectedTags.value.length > 0 ? selectedTags.value.join(',') : undefined
      }
  
      const response = await DataService.listDocuments(params)
      documents.value = response.documents
      total.value = response.total
    } catch (error) {
      ElMessage.error('加载文档列表失败')
      console.error(error)
    } finally {
      loading.value = false
    }
  }
  
  const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
      // 如果搜索为空，重新加载所有文档
      await loadDocuments()
      return
    }
  
    searching.value = true
    try {
      const response = await DataService.searchDocuments(searchQuery.value, 100)
      documents.value = response.results
      total.value = response.total_matches
      currentPage.value = 1
    } catch (error) {
      ElMessage.error('搜索失败')
      console.error(error)
    } finally {
      searching.value = false
    }
  }
  
  const handleFilter = () => {
    currentPage.value = 1
    loadDocuments()
  }
  
  const handleSort = () => {
    currentPage.value = 1
    loadDocuments()
  }
  
  const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 1 ? -1 : 1
    loadDocuments()
  }
  
  const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize
    currentPage.value = 1
    loadDocuments()
  }
  
  const handleCurrentChange = (newPage: number) => {
    currentPage.value = newPage
    loadDocuments()
  }
  
  const createDocument = () => {
    router.push('/editor')
  }
  
  const editDocument = (documentId: string) => {
    router.push(`/editor/${documentId}`)
  }
  
  const duplicateDocument = async (document: DataDocument) => {
    try {
      const newDocument = {
        ...document,
        name: `${document.name} - 副本`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        version: undefined
      }
      
      await DataService.createDocument(newDocument)
      ElMessage.success('文档复制成功')
      await loadDocuments()
    } catch (error) {
      ElMessage.error('文档复制失败')
      console.error(error)
    }
  }
  
  const deleteDocument = async (documentId: string, documentName: string) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除文档"${documentName}"吗？此操作不可恢复。`,
        '确认删除',
        {
          type: 'warning',
          confirmButtonText: '删除',
          confirmButtonClass: 'el-button--danger'
        }
      )
  
      await DataService.deleteDocument(documentId)
      ElMessage.success('文档删除成功')
      await loadDocuments()
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('文档删除失败')
        console.error(error)
      }
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)}天前`
    } else {
      return date.toLocaleDateString()
    }
  }
  </script>
  
  <style scoped>
  .document-list {
    padding: 16px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .header h1 {
    margin: 0;
    color: #303133;
  }
  
  .filters {
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .filter-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .document-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }
  
  .document-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #e1e8ed;
  }
  
  .document-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .document-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
    flex: 1;
    margin-right: 12px;
  }
  
  .card-actions {
    flex-shrink: 0;
  }
  
  .document-description {
    color: #606266;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 16px;
    max-height: 40px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .nodes-preview {
    margin-bottom: 16px;
  }
  
  .nodes-count {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .node-samples {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .node-sample {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  
  .node-number {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #409eff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    flex-shrink: 0;
  }
  
  .node-content {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  
  .has-image {
    font-size: 10px;
    flex-shrink: 0;
  }
  
  .node-text {
    color: #606266;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .more-nodes {
    font-size: 12px;
    color: #909399;
    text-align: center;
    padding: 4px 0;
  }
  
  .document-tags {
    margin-bottom: 16px;
    min-height: 28px;
  }
  
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  .document-stats {
    display: flex;
    gap: 12px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #909399;
  }
  
  .stat-item i {
    font-size: 14px;
  }
  
  .document-meta {
    text-align: right;
  }
  
  .update-time {
    font-size: 12px;
    color: #909399;
  }
  
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }
  
  .empty-content {
    text-align: center;
    color: #909399;
  }
  
  .empty-content i {
    font-size: 64px;
    margin-bottom: 16px;
    color: #c0c4cc;
  }
  
  .empty-content h3 {
    margin: 0 0 8px 0;
    color: #606266;
  }
  
  .empty-content p {
    margin: 0 0 24px 0;
    color: #909399;
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    padding: 24px 0;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .document-grid {
      grid-template-columns: 1fr;
    }
    
    .filters {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-bar {
      width: 100%;
    }
    
    .search-bar .el-input {
      width: 100% !important;
    }
    
    .filter-controls {
      justify-content: space-between;
    }
  }
  </style>