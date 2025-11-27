
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './containers/Layout';
import ChatPage from './pages/ChatPage';
import MockChatPage from './pages/MockChatPage';
import axios from 'axios';

if (typeof window !== 'undefined') {
  Object.assign(window, { axios });
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="mock-chat" element={<MockChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
