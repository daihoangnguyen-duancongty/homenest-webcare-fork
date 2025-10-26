import { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './../components/sidebar/Sidebar';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import EmployeePanel from '../components/EmployeePanel';
import type { ModuleKey } from './../components/sidebar/Sidebar';

export default function AdminDashboard() {
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>('chat');
  // const [globalLoading, setGlobalLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    <Box sx={{ display: 'flex', position: 'relative', height: '100vh', width: '100vw' }}>
      <Header isExpanded={isSidebarExpanded} activeSection={activeModule} isMobile={mobileOpen} />
      <Sidebar
        role="admin"
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        setActiveModule={setActiveModule}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onSelectUser={(userId) => {
          // setGlobalLoading(true);
          handleOpenChat(userId);
        }}
      />
      {/* ================= Content chính ================= */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          ml: !isMobile ? (isSidebarExpanded ? '280px' : '60px') : 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          transition: 'margin-left 0.4s',
        }}
      >
        {activeModule === 'chat' &&
          openChats.map((userId, idx) => {
            const isActive = activeChat === userId;
            return (
              <ChatPanel
                key={userId}
                userId={userId}
                role="admin"
                onClose={() => handleCloseChat(userId)}
                onClick={() => setActiveChat(userId)} // khi click chat, set active
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  right: 20 + idx * 340,

                  zIndex: isActive ? 2000 : 1000 + idx, // z-index động
                }}
              />
            );
          })}

        {activeModule === 'employee' && <EmployeePanel />}
      </Box>
      {/* ================= Loading overlay ================= */}
      {/* {globalLoading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 2000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
          <Typography mt={2}>Đang tải dữ liệu...</Typography>
        </Box>
      )} */}
    </Box>
  );
}
