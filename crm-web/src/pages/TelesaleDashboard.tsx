// src/pages/TelesaleDashboard.tsx
import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import { getCurrentUser } from '../utils/auth';

export default function TelesaleDashboard() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<'chat' | 'customers' | 'automation' | 'reports'>(
    'chat'
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const user = getCurrentUser(); // Lấy info user hiện tại
  const role = user?.role || 'telesale'; // gán role telesale

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        bgcolor: 'linear-gradient(180deg, #2979ca 0%, #edf2f7 100%)',
      }}
    >
      <Sidebar
        onSelectUser={setSelectedUser}
        setActiveModule={setActiveModule}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        role={role} // Có thể dùng để lọc menu dành cho telesale
      />
      <Header isExpanded={isExpanded} activeSection={activeModule} />

      <Box
        flex={1}
        sx={{
          marginLeft: isExpanded ? '280px' : '60px',
          marginTop: '10vh',
          p: 3,
          transition: 'margin-left 0.3s ease',
          overflow: 'auto',
        }}
      >
        {activeModule === 'chat' ? (
          selectedUser ? (
            <ChatPanel userId={selectedUser} role={role} />
          ) : (
            <Box
              flex={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="text.secondary"
            >
              💬 Chọn khách hàng để bắt đầu trò chuyện
            </Box>
          )
        ) : (
          <Box flex={1} display="flex" alignItems="center" justifyContent="center">
            🚧 Module "{activeModule}" đang được phát triển
          </Box>
        )}
      </Box>
    </Box>
  );
}
