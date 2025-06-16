<template>
  <div class="document-list">
    <!-- 页面头部 -->
    <div class="header">
      <h1>数据文档管理</h1>
      <div class="header-actions">
        <el-button type="success" @click="showPPTUploadDialog" :loading="pptUploading">
          <el-icon><Upload /></el-icon>
          导入PPT
        </el-button>
        <el-button type="primary" @click="createDocument">
          <el-icon><Plus /></el-icon>
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
          @change="loadDocuments"
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
          style="width: 120px; margin-right: 16px;"
          @change="loadDocuments"
        >
          <el-option label="创建时间" value="created_at" />
          <el-option label="更新时间" value="updated_at" />
          <el-option label="文档名称" value="name" />
        </el-select>
        
        <el-button-group>
          <el-button 
            :type="sortOrder === -1 ? 'primary' : 'default'"
            @click="changeSortOrder(-1)"
          >
            降序
          </el-button>
          <el-button 
            :type="sortOrder === 1 ? 'primary' : 'default'"
            @click="changeSortOrder(1)"
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
                ⋯
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
              🖼️ {{ document.data_list.filter(item => item.image).length }}
            </span>
            <span class="stat-item">
              📄 {{ document.data_list.filter(item => item.text.trim()).length }}
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
        <div class="empty-icon">📄</div>
        <h3>暂无数据文档</h3>
        <p>点击"新建文档"开始创建您的第一个数据文档，或点击"导入PPT"从现有PPT文件导入</p>
        <div class="empty-actions">
          <el-button type="success" @click="showPPTUploadDialog">
            导入PPT
          </el-button>
          <el-button type="primary" @click="createDocument">
            新建文档
          </el-button>
        </div>
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

    <!-- PPT上传对话框 -->
    <el-dialog
      v-model="pptDialogVisible"
      title="智能PPT导入"
      width="700px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="ppt-upload-dialog">
        <!-- 功能说明 -->
        <div class="feature-intro">
          <el-alert
            title="AI智能解析"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>我们会将PPT的每一页转换为图片，然后使用AI图像理解模型自动生成对应的讲解内容。</p>
              <p>您可以自定义提示词来指定AI分析的重点和风格。</p>
            </template>
          </el-alert>
        </div>
        
        <!-- 文件上传区域 -->
        <div class="upload-section">
          <el-upload
            ref="pptUploadRef"
            :file-list="pptFileList"
            :before-upload="beforePPTUpload"
            :on-change="handlePPTFileChange"
            :on-remove="handlePPTFileRemove"
            :auto-upload="false"
            accept=".ppt,.pptx"
            drag
            :limit="1"
          >
            <div class="upload-content">
              <div class="upload-icon">
                <el-icon size="48"><Document /></el-icon>
              </div>
              <div class="upload-text">点击或拖拽上传PPT文件</div>
              <div class="upload-hint">支持 .ppt 和 .pptx 格式，大小不超过 50MB</div>
            </div>
          </el-upload>
        </div>
        
        <!-- 提示词设置 -->
        <div class="prompt-section">
          <el-form-item label="AI分析提示词">
            <el-input
              v-model="pptPrompt"
              type="textarea"
              :rows="4"
              placeholder="请输入AI分析提示词，用于指导AI如何理解和描述PPT内容..."
              show-word-limit
              :maxlength="500"
            />
            <div class="prompt-templates">
              <span class="template-label">常用模板:</span>
              <el-button 
                v-for="template in promptTemplates" 
                :key="template.name"
                size="small" 
                type="text" 
                @click="pptPrompt = template.content"
              >
                {{ template.name }}
              </el-button>
            </div>
          </el-form-item>
        </div>

        <!-- 预估处理时间提示 -->
        <div class="processing-hint">
          <el-alert
            title="处理时间预估"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>每张幻灯片大约需要 3-5 秒处理时间</p>
              <p>建议在处理期间不要关闭页面</p>
            </template>
          </el-alert>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closePPTDialog" :disabled="pptProcessing">取消</el-button>
          <el-button 
            type="primary" 
            @click="handlePPTImport" 
            :loading="pptProcessing"
            :disabled="pptFileList.length === 0"
          >
            {{ pptProcessing ? 'AI正在分析中...' : '开始智能导入' }}
          </el-button>
        </div>
      </template>
    </el-dialog>


    <!-- PPT处理进度对话框 -->
    <el-dialog
      v-model="pptProgressVisible"
      title="AI智能解析进度"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="progress-content">
        <div class="progress-header">
          <div class="progress-icon">
            <el-icon class="rotating" size="64"><Loading /></el-icon>
          </div>
          <div class="progress-text">
            <h3>AI正在智能解析PPT内容...</h3>
            <p>{{ pptProgressMessage }}</p>
          </div>
        </div>
        
        <div class="progress-bar">
          <el-progress 
            :percentage="pptProgressPercent" 
            :stroke-width="12"
            :show-text="true"
            :format="formatProgress"
          />
        </div>

        <div class="progress-details">
          <div class="detail-row">
            <span class="label">文件名:</span>
            <span class="value">{{ currentPPTFileName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">处理阶段:</span>
            <span class="value">{{ currentProcessingStage }}</span>
          </div>
          <div class="detail-row">
            <span class="label">预计剩余时间:</span>
            <span class="value">{{ estimatedTimeRemaining }}</span>
          </div>
        </div>

        <div class="ai-analysis-preview" v-if="currentSlidePreview">
          <h4>当前分析预览</h4>
          <div class="preview-content">
            <div class="slide-image" v-if="currentSlidePreview.image">
              <img :src="`data:image/png;base64,${currentSlidePreview.image}`" alt="当前幻灯片" />
            </div>
            <div class="slide-analysis">
              <p>{{ currentSlidePreview.analysis || '正在分析中...' }}</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Loading, Upload, Plus, Document } from '@element-plus/icons-vue'
import { DataService, type DataDocument } from '@/services/api'
import type { UploadFile, UploadFiles } from 'element-plus'

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

// PPT导入相关
const pptDialogVisible = ref(false)
const pptProgressVisible = ref(false)
const pptUploading = ref(false)
const pptProcessing = ref(false)
const pptFileList = ref<UploadFiles>([])
const pptPrompt = ref(`讲解内容干净利落，不做过多的其他关系不大的讲解，只聚焦于当前页的内容进行讲解。
以老师的口吻进行讲解，不需要开场白和结束语，直接进行讲解。`)

// 进度相关
const pptProgressPercent = ref(0)
const pptProgressMessage = ref('准备处理文件...')
const currentPPTFileName = ref('')
const currentProcessingStage = ref('准备中')
const estimatedTimeRemaining = ref('计算中...')
const currentSlidePreview = ref<{image?: string, analysis?: string} | null>(null)

// 提示词模板
const promptTemplates = ref([
  {
    name: '教学讲解',
    content: '讲解内容干净利落，不做过多的其他关系不大的讲解，只聚焦于当前页的内容进行讲解。以老师的口吻进行讲解，不需要开场白和结束语，直接进行讲解。'
  },
  {
    name: '商务汇报',
    content: '以专业商务的语调描述幻灯片内容，重点关注数据、图表和关键信息点，适合商务汇报场景。'
  },
  {
    name: '技术文档',
    content: '详细描述技术内容，重点解释概念、流程和技术细节，适合技术文档和培训材料。'
  },
  {
    name: '简洁总结',
    content: '用简洁明了的语言总结幻灯片的核心内容，突出要点，适合快速阅读和理解。'
  }
])

const pptUploadRef = ref()

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
  checkPPTProcessorHealth()
})

// 基础方法
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
    await loadDocuments()
    return
  }

  searching.value = true
  try {
    const response = await DataService.searchDocuments(searchQuery.value)
    documents.value = response.documents
    total.value = response.total_matches
  } catch (error) {
    ElMessage.error('搜索失败')
    console.error(error)
  } finally {
    searching.value = false
  }
}

const changeSortOrder = (order: number) => {
  sortOrder.value = order
  loadDocuments()
}

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadDocuments()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
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

// PPT导入相关方法
const checkPPTProcessorHealth = async () => {
  try {
    const health = await DataService.checkPPTProcessorHealth()
    if (!health.ppt_processor?.healthy) {
      console.warn('PPT处理器健康检查失败:', health.ppt_processor?.message)
    }
  } catch (error) {
    console.warn('无法检查PPT处理器状态:', error)
  }
}

const showPPTUploadDialog = () => {
  pptDialogVisible.value = true
  pptFileList.value = []
  // 重置提示词为默认值
  pptPrompt.value = `讲解内容干净利落，不做过多的其他关系不大的讲解，只聚焦于当前页的内容进行讲解。
以老师的口吻进行讲解，不需要开场白和结束语，直接进行讲解。`
}

const closePPTDialog = () => {
  if (pptProcessing.value) {
    ElMessage.warning('正在处理中，请稍候...')
    return
  }
  pptDialogVisible.value = false
  pptFileList.value = []
}

const beforePPTUpload = (file: File) => {
  const isPPT = file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx')
  if (!isPPT) {
    ElMessage.error('只能上传PPT格式文件!')
    return false
  }

  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB!')
    return false
  }

  return false // 阻止自动上传
}

const handlePPTFileChange = (file: UploadFile, fileList: UploadFiles) => {
  pptFileList.value = fileList
}

const handlePPTFileRemove = (file: UploadFile, fileList: UploadFiles) => {
  pptFileList.value = fileList
}

const handlePPTImport = async () => {
  if (pptFileList.value.length === 0) {
    ElMessage.warning('请选择PPT文件')
    return
  }

  if (!pptPrompt.value.trim()) {
    ElMessage.warning('请输入AI分析提示词')
    return
  }

  const file = pptFileList.value[0]
  if (!file.raw) {
    ElMessage.error('文件读取失败')
    return
  }

  pptProcessing.value = true
  currentPPTFileName.value = file.name

  try {
    // 关闭上传对话框，显示进度对话框
    pptDialogVisible.value = false
    pptProgressVisible.value = true
    pptProgressPercent.value = 5
    pptProgressMessage.value = '正在上传文件...'
    currentProcessingStage.value = '文件上传'
    estimatedTimeRemaining.value = '预计 2-5 分钟'

    // 创建FormData
    const formData = new FormData()
    formData.append('file', file.raw)
    formData.append('prompt', pptPrompt.value)

    // 模拟进度更新
    const progressTimer = setInterval(() => {
      if (pptProgressPercent.value < 90) {
        const increment = Math.random() * 5 + 2
        pptProgressPercent.value = Math.min(pptProgressPercent.value + increment, 90)
        
        if (pptProgressPercent.value < 20) {
          currentProcessingStage.value = 'PPT转换为图片'
          pptProgressMessage.value = '正在将PPT页面转换为图片...'
        } else if (pptProgressPercent.value < 50) {
          currentProcessingStage.value = 'AI图像分析'
          pptProgressMessage.value = '正在使用AI分析幻灯片内容...'
        } else if (pptProgressPercent.value < 80) {
          currentProcessingStage.value = '生成讲解内容'
          pptProgressMessage.value = '正在生成智能讲解内容...'
        } else {
          currentProcessingStage.value = '创建数据文档'
          pptProgressMessage.value = '正在创建数据文档...'
        }

        // 更新预计剩余时间
        const remaining = Math.max(1, Math.ceil((100 - pptProgressPercent.value) / 10))
        estimatedTimeRemaining.value = `约 ${remaining} 分钟`
      }
    }, 2000)

    // 调用PPT导入API
    const response = await DataService.importPPTDocument(formData)
    
    clearInterval(progressTimer)
    pptProgressPercent.value = 100
    pptProgressMessage.value = 'AI解析完成!'
    currentProcessingStage.value = '完成'
    estimatedTimeRemaining.value = '已完成'

    // 显示成功通知
    ElNotification({
      title: 'PPT智能导入成功',
      message: `文档 "${response.document_name}" 已成功创建，AI解析了 ${response.slides_count} 张幻灯片`,
      type: 'success',
      duration: 8000,
      dangerouslyUseHTMLString: true
    })

    // 等待2秒后关闭进度对话框并刷新列表
    setTimeout(async () => {
      pptProgressVisible.value = false
      await loadDocuments()
      // 可选：跳转到新创建的文档
      // router.push(`/editor/${response.document_id}`)
    }, 2000)

  } catch (error: any) {
    pptProgressVisible.value = false
    console.error('PPT导入失败:', error)
    
    let errorMessage = 'PPT智能导入失败'
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.message) {
      errorMessage = error.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    pptProcessing.value = false
    pptProgressPercent.value = 0
    pptProgressMessage.value = '准备处理文件...'
    currentProcessingStage.value = '准备中'
    estimatedTimeRemaining.value = '计算中...'
  }
}

const formatProgress = (percentage: number) => {
  return `${percentage}%`
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
padding: 24px;
max-width: 1400px;
margin: 0 auto;
}

.header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 24px;
padding-bottom: 16px;
border-bottom: 1px solid #e1e8ed;
}

.header h1 {
margin: 0;
color: #1a1a1a;
font-size: 28px;
font-weight: 600;
}

.header-actions {
display: flex;
gap: 12px;
}

.filters {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 24px;
padding: 16px;
background: #f8f9fa;
border-radius: 8px;
}

.search-bar {
flex: 1;
}

.filter-controls {
display: flex;
align-items: center;
gap: 12px;
}

.document-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
gap: 20px;
margin-bottom: 32px;
}

.document-card {
background: white;
border-radius: 12px;
border: 1px solid #e1e8ed;
padding: 20px;
cursor: pointer;
transition: all 0.2s ease;
position: relative;
}

.document-card:hover {
border-color: #409eff;
box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
transform: translateY(-2px);
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
color: #1a1a1a;
line-height: 1.4;
flex: 1;
margin-right: 12px;
}

.card-actions {
flex-shrink: 0;
}

.document-description {
color: #657786;
font-size: 14px;
line-height: 1.5;
margin-bottom: 16px;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
min-height: 42px;
}

.nodes-preview {
margin-bottom: 16px;
}

.nodes-count {
font-size: 12px;
color: #8899a6;
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
padding: 6px 8px;
background: #f7f9fa;
border-radius: 6px;
font-size: 12px;
}

.node-number {
background: #409eff;
color: white;
width: 18px;
height: 18px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-size: 10px;
font-weight: bold;
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
flex-shrink: 0;
}

.node-text {
color: #657786;
truncate: true;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}

.more-nodes {
padding: 6px 8px;
background: #e1e8ed;
border-radius: 6px;
font-size: 12px;
color: #8899a6;
text-align: center;
font-style: italic;
}

.document-tags {
margin-bottom: 16px;
min-height: 24px;
}

.card-footer {
display: flex;
justify-content: space-between;
align-items: center;
padding-top: 12px;
border-top: 1px solid #f1f3f4;
}

.document-stats {
display: flex;
gap: 12px;
}

.stat-item {
font-size: 12px;
color: #8899a6;
display: flex;
align-items: center;
gap: 4px;
}

.document-meta {
text-align: right;
}

.update-time {
font-size: 12px;
color: #8899a6;
}

.empty-state {
display: flex;
justify-content: center;
align-items: center;
padding: 80px 20px;
}

.empty-content {
text-align: center;
max-width: 400px;
}

.empty-icon {
font-size: 64px;
margin-bottom: 16px;
}

.empty-content h3 {
margin: 0 0 8px 0;
color: #1a1a1a;
font-size: 20px;
}

.empty-content p {
margin: 0 0 24px 0;
color: #657786;
line-height: 1.5;
}

.empty-actions {
display: flex;
gap: 12px;
justify-content: center;
}

.pagination {
display: flex;
justify-content: center;
padding: 32px 0;
}

/* PPT上传对话框样式 */
.ppt-upload-dialog {
padding: 20px 0;
}


.prompt-section {
border-top: 1px solid #e1e8ed;
padding-top: 20px;
}

/* PPT进度对话框样式 */
.progress-content {
text-align: center;
padding: 20px;
}

.progress-icon {
font-size: 48px;
color: #409eff;
margin-bottom: 20px;
}

.rotating {
animation: rotate 2s linear infinite;
}

@keyframes rotate {
from {
  transform: rotate(0deg);
}
to {
  transform: rotate(360deg);
}
}

.progress-text {
margin-bottom: 20px;
}

.progress-text h3 {
margin: 0 0 8px 0;
color: #1a1a1a;
font-size: 18px;
}

.progress-text p {
margin: 0;
color: #657786;
font-size: 14px;
}

.progress-details {
margin-top: 20px;
padding-top: 16px;
border-top: 1px solid #e1e8ed;
}

.progress-details p {
margin: 4px 0;
font-size: 12px;
color: #8899a6;
}

/* 响应式设计 */
@media (max-width: 768px) {
.document-list {
padding: 16px;
}

.header {
flex-direction: column;
gap: 16px;
align-items: stretch;
}

.header-actions {
justify-content: center;
}

.filters {
flex-direction: column;
gap: 16px;
align-items: stretch;
}

.filter-controls {
flex-wrap: wrap;
justify-content: center;
}

.document-grid {
grid-template-columns: 1fr;
}
}

.feature-intro {
  margin-bottom: 24px;
}

.upload-section {
  margin-bottom: 24px;
}

.upload-content {
  text-align: center;
  padding: 40px 20px;
}

.upload-icon {
  margin-bottom: 16px;
  color: #409eff;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.prompt-section {
  border-top: 1px solid #e1e8ed;
  padding-top: 20px;
  margin-bottom: 20px;
}

.prompt-templates {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.template-label {
  font-size: 12px;
  color: #909399;
}

.processing-hint {
  margin-top: 16px;
}

/* PPT进度对话框样式 */
.progress-content {
  padding: 20px;
}

.progress-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.progress-icon {
  margin-right: 20px;
  color: #409eff;
}

.rotating {
  animation: rotate 2s linear infinite;
}

.progress-text h3 {
  margin: 0 0 8px 0;
  color: #1a1a1a;
  font-size: 18px;
}

.progress-text p {
  margin: 0;
  color: #657786;
  font-size: 14px;
}

.progress-bar {
  margin-bottom: 30px;
}

.progress-details {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 14px;
  color: #8899a6;
}

.value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.ai-analysis-preview {
  border-top: 1px solid #e1e8ed;
  padding-top: 20px;
}

.ai-analysis-preview h4 {
  margin: 0 0 16px 0;
  color: #1a1a1a;
  font-size: 16px;
}

.preview-content {
  display: flex;
  gap: 16px;
}

.slide-image {
  flex-shrink: 0;
  width: 120px;
}

.slide-image img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.slide-analysis {
  flex: 1;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-header {
    flex-direction: column;
    text-align: center;
  }
  
  .progress-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }
  
  .preview-content {
    flex-direction: column;
  }
  
  .slide-image {
    width: 100%;
  }
}
</style>