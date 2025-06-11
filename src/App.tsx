import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from '@/components/Layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import MCPConfig from '@/pages/MCPConfig';
import LLMConfig from '@/pages/LLMConfig';
import DataManagement from '@/pages/DataManagement';
import ChatTest from '@/pages/ChatTest';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="mcp-config" element={<MCPConfig />} />
            <Route path="llm-config" element={<LLMConfig />} />
            <Route path="data-management" element={<DataManagement />} />
            <Route path="chat-test" element={<ChatTest />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;