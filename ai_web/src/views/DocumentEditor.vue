<template>
    <div class="document-editor">
      <!-- 页面头部 -->
      <div class="header">
        <h1>数据文档编辑器</h1>
        <div class="header-actions">
          <el-input
            v-model="document.name"
            placeholder="请输入文档名称"
            style="width: 300px; margin-right: 16px;"
          />
          <el-button type="primary" @click="saveDocument" :loading="saving">
            {{ documentId ? '更新' : '保存' }}
          </el-button>
          <el-button @click="goToList">返回列表</el-button>
        </div>
      </div>
  
      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 左侧：节点记录 -->
        <div class="left-panel">
          <h3>节点记录</h3>
          <div class="node-list">
            <div
              v-for="(item, index) in document.data_list"
              :key="item.sequence"
              :class="['node-item', { active: currentNodeIndex === index }]"
              @click="switchToNode(index)"
            >
              <div class="node-number">{{ item.sequence }}</div>
              <div class="node-preview">
                <div class="text-preview">{{ item.text || '空文本' }}</div>
                <div v-if="item.image" class="image-indicator">🖼️</div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 中间：当前节点编辑 -->
        <div class="center-panel">
          <div v-if="currentNode" class="node-editor">
            <!-- 上半部分：图片 -->
            <div class="image-section">
              <div v-if="currentNode.image" class="image-display">
                <img :src="`data:${currentNode.image_mimetype};base64,${currentNode.image}`" alt="节点图片" />
                <div class="image-actions">
                  <el-button size="small" @click="removeImage">删除图片</el-button>
                  <el-button size="small" @click="$refs.fileInput.click()">更换图片</el-button>
                </div>
              </div>
              <div v-else class="image-upload">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleImageUpload"
                  accept="image/*"
                  drag
                >
                  <div class="upload-content">
                    <i class="el-icon-upload"></i>
                    <div>点击或拖拽上传图片</div>
                  </div>
                </el-upload>
              </div>
            </div>
  
            <!-- 下半部分：文本输入 -->
            <div class="text-section">
              <el-input
                v-model="currentNode.text"
                type="textarea"
                :rows="8"
                placeholder="请输入节点文本内容..."
                @input="onNodeContentChange"
              />
            </div>
          </div>
          <div v-else class="empty-state">
            <p>请选择或创建一个节点</p>
          </div>
        </div>
  
        <!-- 右侧：添加节点 -->
        <div class="right-panel">
          <h3>节点操作</h3>
          <div class="node-actions">
            <el-button type="primary" @click="addNextNode" :disabled="!canAddNode">
              添加下一节点
            </el-button>
            <el-button v-if="currentNode" type="danger" @click="deleteCurrentNode">
              删除当前节点
            </el-button>
          </div>
          
          <!-- 文档信息 -->
          <div class="document-info">
            <h4>文档信息</h4>
            <el-form label-width="80px">
              <el-form-item label="描述">
                <el-input
                  v-model="document.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入文档描述"
                />
              </el-form-item>
              <el-form-item label="标签">
                <el-tag
                  v-for="tag in document.tags"
                  :key="tag"
                  closable
                  @close="removeTag(tag)"
                  style="margin-right: 8px; margin-bottom: 8px;"
                >
                  {{ tag }}
                </el-tag>
                <el-input
                  v-if="inputVisible"
                  ref="SaveTagInput"
                  v-model="inputValue"
                  size="small"
                  style="width: 100px;"
                  @keyup.enter="handleInputConfirm"
                  @blur="handleInputConfirm"
                />
                <el-button v-else size="small" @click="showInput">+ 新标签</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
  
      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { DataService, type DataDocument, type DataItemContent } from '@/services/api'
  
  const route = useRoute()
  const router = useRouter()
  
  // 响应式数据
  const documentId = ref<string | null>(route.params.id as string || null)
  const saving = ref(false)
  const currentNodeIndex = ref(0)
  
  // 文档数据
  const document = reactive<DataDocument>({
    name: '',
    description: '',
    data_list: [],
    tags: [],
    metadata: {}
  })
  
  // 标签输入相关
  const inputVisible = ref(false)
  const inputValue = ref('')
  
  // 计算属性
  const currentNode = computed(() => {
    return document.data_list[currentNodeIndex.value] || null
  })
  
  const canAddNode = computed(() => {
    return document.data_list.length === 0 || 
           (currentNode.value && (currentNode.value.text.trim() || currentNode.value.image))
  })
  
  // 生命周期
  onMounted(async () => {
    if (documentId.value) {
      await loadDocument()
    } else {
      // 新建文档，添加第一个节点
      addFirstNode()
    }
  })
  
  // 方法
  const loadDocument = async () => {
    try {
      const data = await DataService.getDocument(documentId.value!)
      Object.assign(document, data)
      if (document.data_list.length > 0) {
        currentNodeIndex.value = 0
      }
    } catch (error) {
      ElMessage.error('加载文档失败')
      console.error(error)
    }
  }
  
  const saveDocument = async () => {
    if (!document.name.trim()) {
      ElMessage.warning('请输入文档名称')
      return
    }
  
    if (document.data_list.length === 0) {
      ElMessage.warning('至少需要一个节点')
      return
    }
  
    saving.value = true
    try {
      if (documentId.value) {
        await DataService.updateDocument(documentId.value, document)
        ElMessage.success('文档更新成功')
      } else {
        const result = await DataService.createDocument(document)
        documentId.value = result.id!
        ElMessage.success('文档创建成功')
        // 更新路由
        router.replace(`/editor/${result.id}`)
      }
    } catch (error) {
      ElMessage.error('保存失败')
      console.error(error)
    } finally {
      saving.value = false
    }
  }
  
  const addFirstNode = () => {
    const newNode: DataItemContent = {
      sequence: 1,
      text: '',
      image: undefined,
      image_filename: undefined,
      image_mimetype: undefined
    }
    document.data_list.push(newNode)
    currentNodeIndex.value = 0
  }
  
  const addNextNode = () => {
    if (!canAddNode.value) return
  
    const newSequence = Math.max(...document.data_list.map(item => item.sequence)) + 1
    const newNode: DataItemContent = {
      sequence: newSequence,
      text: '',
      image: undefined,
      image_filename: undefined,
      image_mimetype: undefined
    }
    
    document.data_list.push(newNode)
    currentNodeIndex.value = document.data_list.length - 1
  }
  
  const deleteCurrentNode = async () => {
    if (!currentNode.value) return
  
    try {
      await ElMessageBox.confirm('确定要删除当前节点吗？', '确认删除', {
        type: 'warning'
      })
  
      document.data_list.splice(currentNodeIndex.value, 1)
      
      // 重新排序
      document.data_list.forEach((item, index) => {
        item.sequence = index + 1
      })
  
      // 调整当前索引
      if (currentNodeIndex.value >= document.data_list.length) {
        currentNodeIndex.value = Math.max(0, document.data_list.length - 1)
      }
  
      ElMessage.success('节点删除成功')
    } catch {
      // 用户取消
    }
  }
  
  const switchToNode = (index: number) => {
    currentNodeIndex.value = index
  }
  
  const handleImageUpload = async (file: File) => {
    if (!currentNode.value) return false
  
    try {
      const result = await DataService.uploadImage(file)
      currentNode.value.image = result.image_data
      currentNode.value.image_filename = result.filename
      currentNode.value.image_mimetype = result.mimetype
      ElMessage.success('图片上传成功')
    } catch (error) {
      ElMessage.error('图片上传失败')
      console.error(error)
    }
    
    return false // 阻止默认上传行为
  }
  
  const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      await handleImageUpload(file)
    }
    target.value = '' // 清空文件输入
  }
  
  const removeImage = () => {
    if (currentNode.value) {
      currentNode.value.image = undefined
      currentNode.value.image_filename = undefined
      currentNode.value.image_mimetype = undefined
    }
  }
  
  const onNodeContentChange = () => {
    // 可以在这里添加自动保存逻辑
  }
  
  const goToList = () => {
    router.push('/list')
  }
  
  // 标签相关方法
  const removeTag = (tag: string) => {
    const index = document.tags.indexOf(tag)
    if (index > -1) {
      document.tags.splice(index, 1)
    }
  }
  
  const showInput = () => {
    inputVisible.value = true
    nextTick(() => {
      const input = document.querySelector('.el-input__inner') as HTMLInputElement
      input?.focus()
    })
  }
  
  const handleInputConfirm = () => {
    if (inputValue.value && !document.tags.includes(inputValue.value)) {
      document.tags.push(inputValue.value)
    }
    inputVisible.value = false
    inputValue.value = ''
  }
  </script>
  
  <style scoped>
  .document-editor {
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 16px;
    box-sizing: border-box;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid #e1e8ed;
    margin-bottom: 16px;
  }
  
  .header h1 {
    margin: 0;
    color: #303133;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    gap: 16px;
    min-height: 0;
  }
  
  .left-panel {
    width: 300px;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    padding: 16px;
    overflow-y: auto;
    background: #fafbfc;
  }
  
  .left-panel h3 {
    margin: 0 0 16px 0;
    color: #303133;
  }
  
  .node-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .node-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #e1e8ed;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
  }
  
  .node-item:hover {
    border-color: #409eff;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
  }
  
  .node-item.active {
    border-color: #409eff;
    background: #ecf5ff;
  }
  
  .node-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #409eff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .node-preview {
    flex: 1;
    min-width: 0;
  }
  
  .text-preview {
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }
  
  .image-indicator {
    font-size: 12px;
    color: #909399;
  }
  
  .center-panel {
    flex: 1;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
  
  .node-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .image-section {
    flex: 1;
    min-height: 300px;
    border: 2px dashed #e1e8ed;
    border-radius: 8px;
    position: relative;
  }
  
  .image-display {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .image-display img {
    max-width: 100%;
    max-height: calc(100% - 60px);
    object-fit: contain;
    border-radius: 4px;
  }
  
  .image-actions {
    position: absolute;
    bottom: 16px;
    display: flex;
    gap: 8px;
  }
  
  .image-upload {
    height: 100%;
  }
  
  .upload-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
  }
  
  .upload-content i {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .text-section {
    flex: 1;
    min-height: 200px;
  }
  
  .empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    font-size: 16px;
  }
  
  .right-panel {
    width: 280px;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    padding: 16px;
    overflow-y: auto;
    background: #fafbfc;
  }
  
  .right-panel h3,
  .right-panel h4 {
    margin: 0 0 16px 0;
    color: #303133;
  }
  
  .node-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }
  
  .document-info {
    border-top: 1px solid #e1e8ed;
    padding-top: 16px;
  }
  
  /* Element Plus 样式覆盖 */
  :deep(.el-upload-dragger) {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 6px;
  }
  
  :deep(.el-textarea__inner) {
    resize: none;
  }
  </style>