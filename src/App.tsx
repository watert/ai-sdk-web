
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './containers/Layout';
import ChatPage from './pages/ChatPage';
import MockChatPage from './pages/MockChatPage';
import EventListPage from './pages/EventListPage';
import EventDetailPage from './pages/EventDetailPage';
import EventEditPage from './pages/EventEditPage';
import IndustryListPage from './pages/IndustryListPage';
import IndustryDetailPage from './pages/IndustryDetailPage';
import IndustryResearchPage from './pages/IndustryResearchPage';
import RequestAiStreamDemoPage from './pages/RequestAiStreamDemoPage';
import axios from 'axios';

if (typeof window !== 'undefined') {
  Object.assign(window, { axios });
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div className="flex items-center justify-center h-full p-4 text-gray-500">请选择左侧菜单开始使用</div>} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="mock-chat" element={<MockChatPage />} />
          <Route path="events" element={<EventListPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="events/:id/edit" element={<EventEditPage />} />
          <Route path="events/new" element={<EventEditPage />} />
          <Route path="industries" element={<IndustryListPage />}>
            <Route index element={<Navigate to="/industries/1" replace />} />
            <Route path=":id" element={<IndustryDetailPage />} />
          </Route>
          <Route path="industry-research" element={<IndustryResearchPage />} />
          <Route path="demo-ai-stream" element={<RequestAiStreamDemoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
