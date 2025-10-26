import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './../components/sidebar/Sidebar';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import { getCurrentUser } from '../utils/auth';

export default function TelesaleDashboard() {
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<'chat' | 'employee' | 'automation' | 'reports'>(
    'chat'
  );

  const [isExpanded, setIsExpanded] = useState(false);

  const user = getCurrentUser();
  const role = user?.role || 'telesale';
  // mo nhieu chat cung luc
  const handleOpenChat = (userId: string) => {
    setOpenChats((prev) => {
      if (!prev.includes(userId)) return [...prev, userId];
      return prev;
    });
  };

  const handleCloseChat = (userId: string) => {
    setOpenChats((prev) => prev.filter((id) => id !== userId));
  };
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        bgcolor: 'linear-gradient(180deg, #2979ca 0%, #edf2f7 100%)',
      }}
    >
      <Sidebar
        setActiveModule={setActiveModule}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        role={role}
        onSelectUser={(userId) => {
          // setGlobalLoading(true);
          handleOpenChat(userId);
        }}
      />
      <Header isExpanded={isExpanded} activeSection={activeModule} />
      <Box
        sx={{
          flex: 1,
          marginLeft: isExpanded ? '280px' : '60px',
          marginTop: '10vh',
          p: 3,
          transition: 'margin-left 0.3s ease',
          overflow: 'auto',
        }}
      >
        {activeModule === 'chat' &&
          openChats.map((userId, idx) => (
            <ChatPanel
              key={userId}
              userId={userId}
              role="admin"
              onClose={() => handleCloseChat(userId)}
              sx={{
                position: 'fixed',
                bottom: 0,
                right: 20 + idx * 340,
                width: 320,
                minWidth: 320,
              }}
            />
          ))}
      </Box>
    </Box>
  );
}
