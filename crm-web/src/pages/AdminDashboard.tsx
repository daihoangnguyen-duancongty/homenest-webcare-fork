import { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './../components/sidebar/Sidebar';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import EmployeePanel from '../components/EmployeePanel';
import type { ModuleKey } from './../components/sidebar/Sidebar';

export default function AdminDashboard() {
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>('chat');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          setGlobalLoading(true);
          setActiveUserId(userId);
        }}
      />
      {/* ================= Content chính ================= */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          ml: !isMobile ? (isSidebarExpanded ? '280px' : '60px') : 0,
          transition: 'margin-left 0.4s',
        }}
      >
        {activeModule === 'chat' && activeUserId && (
          <ChatPanel userId={activeUserId} role="admin" onLoaded={() => setGlobalLoading(false)} />
        )}

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
