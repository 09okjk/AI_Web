import React, { useState, useRef } from 'react';
import {
  Card,
  Button,
  Steps,
  Upload,
  Input,
  Space,
  message,
  Modal,
  Form,
  Table,
  Tag,
  Popconfirm,
  Image,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores/useAppStore';
import { dataAPI } from '@/services/api';
import type { DataDocument, DataItemContent, DataDocumentCreate } from '@/types';

const { TextArea } = Input;
const { Step } = Steps;

interface DataCreationState {
  isCreating: boolean;
  currentStep: number;
  dataItems: DataItemContent[];
  documentInfo: {
    name: string;
    description: string;
    tags: string[];
  };
}

const DataManagementPage: React.FC = () => {
  const { dataDocuments, setDataDocuments, addDataDocument, removeDataDocument } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [creationState, setCreationState] = useState<DataCreationState>({
    isCreating: false,
    currentStep: 0,
    dataItems: [],
    documentInfo: {
      name: '',
      description: '',
      tags: [],
    },
  });
  const [documentInfoModalVisible, setDocumentInfoModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DataDocument | null>(null);
  const [form] = Form.useForm();
  const fileInputRef = useRef<any>(null);

  // 初始化创建流程
  const startCreation = () => {
    setCreationState({
      isCreating: true,
      currentStep: 0,
      dataItems: [{ sequence: 1, text: '', image: undefined }],
      documentInfo: { name: '', description: '', tags: [] },
    });
    setViewMode('create');
  };

  // 取消创建
  const cancelCreation = () => {
    Modal.confirm({
      title: '确认取消',
      content: '取消创建将丢失所有已输入的数据，确定要取消吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setViewMode('list');
        setCreationState({
          isCreating: false,
          currentStep: 0,
          dataItems: [],
          documentInfo: { name: '', description: '', tags: [] },
        });
      },
    });
  };

  // 添加新的数据项
  const addDataItem = () => {
    const newSequence = creationState.dataItems.length + 1;
    setCreationState(prev => ({
      ...prev,
      dataItems: [...prev.dataItems, { sequence: newSequence, text: '', image: undefined }],
      currentStep: newSequence - 1,
    }));
  };

  // 切换到指定步骤
  const goToStep = (step: number) => {
    if (step >= 0 && step < creationState.dataItems.length) {
      setCreationState(prev => ({ ...prev, currentStep: step }));
    }
  };

  // 更新当前数据项
  const updateCurrentDataItem = (updates: Partial<DataItemContent>) => {
    setCreationState(prev => ({
      ...prev,
      dataItems: prev.dataItems.map((item, index) =>
        index === prev.currentStep ? { ...item, ...updates } : item
      ),
    }));
  };

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    try {
      const response = await dataAPI.uploadImage(file);
      updateCurrentDataItem({
        image: response.data.image_data,
        image_filename: response.data.filename,
        image_mimetype: response.data.mimetype,
      });
      message.success('图片上传成功');
      return false; // 阻止默认上传行为
    } catch (error: any) {
      message.error(error.response?.data?.detail || '图片上传失败');
      return false;
    }
  };

  // 移除当前数据项的图片
  const removeCurrentImage = () => {
    updateCurrentDataItem({
      image: undefined,
      image_filename: undefined,
      image_mimetype: undefined,
    });
  };

  // 删除数据项
  const deleteDataItem = (index: number) => {
    if (creationState.dataItems.length <= 1) {
      message.warning('至少需要保留一个数据项');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个数据项吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const newDataItems = creationState.dataItems.filter((_, i) => i !== index);
        // 重新分配序号
        const resequencedItems = newDataItems.map((item, i) => ({ ...item, sequence: i + 1 }));
        
        setCreationState(prev => ({
          ...prev,
          dataItems: resequencedItems,
          currentStep: Math.min(prev.currentStep, resequencedItems.length - 1),
        }));
      },
    });
  };

  // 设置文档信息
  const handleDocumentInfoSubmit = (values: any) => {
    setCreationState(prev => ({
      ...prev,
      documentInfo: {
        name: values.name,
        description: values.description || '',
        tags: values.tags || [],
      },
    }));
    setDocumentInfoModalVisible(false);
    message.success('文档信息已设置');
  };

  // 保存文档
  const saveDocument = async () => {
    // 验证文档信息
    if (!creationState.documentInfo.name.trim()) {
      setDocumentInfoModalVisible(true);
      message.warning('请先设置文档信息');
      return;
    }

    // 验证数据项
    const invalidItems = creationState.dataItems.filter(item => !item.text.trim());
    if (invalidItems.length > 0) {
      message.warning('请为所有数据项填写文字内容');
      return;
    }

    try {
      setSaving(true);
      const documentData: DataDocumentCreate = {
        name: creationState.documentInfo.name,
        description: creationState.documentInfo.description,
        data_list: creationState.dataItems,
        tags: creationState.documentInfo.tags,
        metadata: {
          created_by: '09okjk',
          total_items: creationState.dataItems.length,
          has_images: creationState.dataItems.some(item => item.image),
        },
      };

      const response = await dataAPI.createDocument(documentData);
      addDataDocument(response.data);
      message.success('文档保存成功');
      
      // 返回列表页面
      setViewMode('list');
      setCreationState({
        isCreating: false,
        currentStep: 0,
        dataItems: [],
        documentInfo: { name: '', description: '', tags: [] },
      });
    } catch (error: any) {
      message.error(error.response?.data?.detail || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 获取文档列表
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await dataAPI.getDocuments();
      setDataDocuments(response.data.documents);
    } catch (error) {
      message.error('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除文档
  const deleteDocument = async (id: string) => {
    try {
      await dataAPI.deleteDocument(id);
      removeDataDocument(id);
      message.success('文档删除成功');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  // 预览文档
  const previewDocument = (document: DataDocument) => {
    setSelectedDocument(document);
    setPreviewModalVisible(true);
  };

  // 获取当前数据项
  const currentDataItem = creationState.dataItems[creationState.currentStep];

  // 列表页面渲染
  const renderListView = () => {
    const columns = [
      {
        title: '文档名称',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record: DataDocument) => (
          <Button type="link" onClick={() => previewDocument(record)}>
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
        title: '数据项数量',
        key: 'itemCount',
        render: (_, record: DataDocument) => (
          <span>{record.data_list.length} 项</span>
        ),
      },
      {
        title: '包含图片',
        key: 'hasImages',
        render: (_, record: DataDocument) => (
          <Tag color={record.data_list.some(item => item.image) ? 'green' : 'default'}>
            {record.data_list.some(item => item.image) ? '是' : '否'}
          </Tag>
        ),
      },
      {
        title: '标签',
        dataIndex: 'tags',
        key: 'tags',
        render: (tags: string[]) => (
          <Space>
            {tags.map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </Space>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (time: string) => new Date(time).toLocaleString(),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_, record: DataDocument) => (
          <Space>
            <Tooltip title="预览">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => previewDocument(record)}
              />
            </Tooltip>
            <Popconfirm
              title="确定要删除这个文档吗？"
              onConfirm={() => deleteDocument(record.id)}
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
            <h1 className="text-2xl font-bold text-gray-800">数据管理</h1>
            <p className="text-gray-600">管理图文混合数据文档</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={startCreation}>
            创建新文档
          </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={dataDocuments}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>
      </div>
    );
  };

  // 创建页面渲染
  const renderCreateView = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">创建数据文档</h1>
            <p className="text-gray-600">
              {creationState.documentInfo.name || '请设置文档信息'}
            </p>
          </div>
          <Space>
            <Button onClick={() => setDocumentInfoModalVisible(true)}>
              设置文档信息
            </Button>
            <Button onClick={cancelCreation}>取消</Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={saveDocument}
              loading={saving}
            >
              保存文档
            </Button>
          </Space>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 左侧步骤 */}
          <div className="col-span-3">
            <Card title="数据项列表" size="small">
              <Steps
                direction="vertical"
                current={creationState.currentStep}
                size="small"
              >
                {creationState.dataItems.map((item, index) => (
                  <Step
                    key={index}
                    title={`第 ${index + 1} 项`}
                    description={item.text.slice(0, 20) + (item.text.length > 20 ? '...' : '')}
                    onClick={() => goToStep(index)}
                    className="cursor-pointer"
                  />
                ))}
              </Steps>
              <div className="mt-4 space-y-2">
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={addDataItem}
                  block
                >
                  添加数据项
                </Button>
                {creationState.dataItems.length > 1 && (
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => deleteDataItem(creationState.currentStep)}
                    block
                  >
                    删除当前项
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* 中间内容区域 */}
          <div className="col-span-7">
            <Card title={`第 ${creationState.currentStep + 1} 项数据`} size="small">
              {/* 图片上传区域 */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">图片 (可选)</h3>
                {currentDataItem?.image ? (
                  <div className="relative">
                    <Image
                      src={`data:${currentDataItem.image_mimetype};base64,${currentDataItem.image}`}
                      alt="上传的图片"
                      style={{ maxWidth: '100%', maxHeight: '300px' }}
                      className="rounded-lg"
                    />
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={removeCurrentImage}
                      className="absolute top-2 right-2"
                    >
                      删除图片
                    </Button>
                  </div>
                ) : (
                  <Upload
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <UploadOutlined className="text-4xl text-gray-400 mb-4" />
                      <p className="text-gray-600">点击上传图片</p>
                      <p className="text-sm text-gray-400">支持 JPG、PNG 格式，最大 5MB</p>
                    </div>
                  </Upload>
                )}
              </div>

              {/* 文字输入区域 */}
              <div>
                <h3 className="font-semibold mb-3">文字内容 <span className="text-red-500">*</span></h3>
                <TextArea
                  value={currentDataItem?.text || ''}
                  onChange={(e) => updateCurrentDataItem({ text: e.target.value })}
                  placeholder="请输入文字内容..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </Card>
          </div>

          {/* 右侧导航 */}
          <div className="col-span-2">
            <Card title="导航" size="small">
              <div className="space-y-2">
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => goToStep(creationState.currentStep - 1)}
                  disabled={creationState.currentStep === 0}
                  block
                >
                  上一项
                </Button>
                <Button
                  icon={<RightOutlined />}
                  onClick={() => goToStep(creationState.currentStep + 1)}
                  disabled={creationState.currentStep === creationState.dataItems.length - 1}
                  block
                >
                  下一项
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  当前: {creationState.currentStep + 1} / {creationState.dataItems.length}
                </p>
                <p className="text-sm text-gray-600">
                  进度: {Math.round(((creationState.currentStep + 1) / creationState.dataItems.length) * 100)}%
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    if (viewMode === 'list') {
      fetchDocuments();
    }
  }, [viewMode]);

  return (
    <>
      {viewMode === 'list' ? renderListView() : renderCreateView()}

      {/* 文档信息设置弹窗 */}
      <Modal
        title="设置文档信息"
        open={documentInfoModalVisible}
        onCancel={() => setDocumentInfoModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDocumentInfoSubmit}
          initialValues={creationState.documentInfo}
        >
          <Form.Item
            label="文档名称"
            name="name"
            rules={[{ required: true, message: '请输入文档名称' }]}
          >
            <Input placeholder="请输入文档名称" />
          </Form.Item>

          <Form.Item label="文档描述" name="description">
            <TextArea rows={3} placeholder="请输入文档描述" />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Select
              mode="tags"
              placeholder="输入标签，按回车确认"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 文档预览弹窗 */}
      <Modal
        title={`预览: ${selectedDocument?.name}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">基本信息</h3>
              <p><strong>描述:</strong> {selectedDocument.description || '无'}</p>
              <p><strong>标签:</strong> 
                <Space className="ml-2">
                  {selectedDocument.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold">数据内容</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedDocument.data_list.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        第 {item.sequence} 项
                      </span>
                    </div>
                    
                    {item.image && (
                      <div className="mb-3">
                        <Image
                          src={`data:${item.image_mimetype};base64,${item.image}`}
                          alt={`第${item.sequence}项图片`}
                          style={{ maxWidth: '100%', maxHeight: '200px' }}
                          className="rounded"
                        />
                      </div>
                    )}
                    
                    <div className="text-gray-700">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default DataManagementPage;