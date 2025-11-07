import { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from '../components/Sidebar/SidebarLayout';
import Header from '../components/Header';
import ChatPanel from './../components/ChatPanel';
import EmployeePanel from '../components/EmployeePanel';
import IncomingCallPopup from '../components/IncomingCallPopup';
import type { ModuleKey } from '../components/Sidebar/SidebarLayout';
import { fetchConversations } from './../api/adminApi';
import { useSocketStore } from '../store/socketStore';
import { getCurrentUser } from '../utils/auth';
import { toast } from 'react-toastify';
import CustomerPanel from '../components/CustomerPanel';
import DashboardModules from '../components/DashboardModules';
import type { InboundCallData } from '../types/index';

export default function AdminDashboard() {
  // call
  const [incomingCall, setIncomingCall] = useState<{ guestName: string; callLink: string } | null>(
    null
  );
  //chat
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatPositions, setChatPositions] = useState<Record<string, { x: number; y: number }>>({});

  const [activeModule, setActiveModule] = useState<ModuleKey>('chat');
  // const [globalLoading, setGlobalLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const CHAT_DEFAULT_WIDTH = 600;
  const CHAT_DEFAULT_HEIGHT = 500;
  // vi tri ban dau cua coversation luc xuat hien
  const getCenterPosition = () => {
    const x = window.innerWidth / 2 - CHAT_DEFAULT_WIDTH / 2;
    const y = window.innerHeight / 2 - CHAT_DEFAULT_HEIGHT / 2;
    return { x, y };
  };
  // mo nhieu chat cung luc
  const handleOpenChat = (userId: string) => {
    setOpenChats((prev) => {
      if (!prev.includes(userId)) {
        const lastUserId = prev[prev.length - 1];
        const lastPos = lastUserId ? chatPositions[lastUserId] : getCenterPosition(); // <-- center nếu chat đầu tiên
        const newPos = { x: lastPos.x + 20, y: lastPos.y + 20 };
        setChatPositions((pos) => ({ ...pos, [userId]: newPos }));
        return [...prev, userId];
      }
      return prev;
    });
    setActiveChat(userId);
  };

  const handleCloseChat = (userId: string) => {
    setOpenChats((prev) => prev.filter((id) => id !== userId));
  };
  // tao socket de nhan cuộc gọi
  const { socket } = useSocketStore();
  const currentUser = getCurrentUser();

  // ---------------- Mở conversation mới nhất khi load ----------------
  useEffect(() => {
    (async () => {
      try {
        const conversations = await fetchConversations();
        if (conversations.length > 0) {
          const latest = conversations[0];
          handleOpenChat(latest.userId);
        }
      } catch (err) {
        console.error('Cannot fetch conversations on load:', err);
        toast.error('❌ Không thể tải danh sách cuộc trò chuyện');
      }
    })();
  }, []);

  //---------------- Lắng nghe sự kiện inbound_call từ socket (khách gọi đến crm) ----------------
  useEffect(() => {
    if (!socket) return;

    const handleInboundCall = (data: InboundCallData) => {
      console.log('📞 inbound_call data received:', data);
      toast.info(`📞 Cuộc gọi đến từ ${data.guestName || 'Khách hàng'}`);
      setIncomingCall({
        guestName: data.guestName || 'Khách hàng',
        callLink: data.callLink,
      });
    };

    socket.on('inbound_call', handleInboundCall);

    return () => {
      socket.off('inbound_call', handleInboundCall);
    };
  }, [socket, currentUser]);

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
        <DashboardModules
          sx={{
            position: 'absolute',
            top: '7vh',
            left: '8vw',
            width: '90%',
          }}
        />
        {activeModule === 'chat' &&
          openChats.map((userId, idx) => {
            if (!userId) return null; // tránh undefined crash
            const isActive = activeChat === userId;
            return (
              <ChatPanel
                key={`${userId}-${idx}`}
                userId={userId}
                role="admin"
                initialPosition={chatPositions[userId]}
                onClose={() => handleCloseChat(userId)}
                onClick={() => setActiveChat(userId)}
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  right: 20 + idx * 340,
                  zIndex: isActive ? 2000 : 1000 + idx,
                }}
              />
            );
          })}

        {activeModule === 'employee' && (
          <EmployeePanel
            sx={{
              position: 'absolute',
              top: '20vh',
              left: '16vw',
              width: '77%',
            }}
          />
        )}
        {activeModule === 'customer' && (
          <CustomerPanel
            sx={{
              position: 'absolute',
              top: '26vh',
              left: '12vw',
              width: '84%',
            }}
            onOpenChat={handleOpenChat}
          />
        )}
      </Box>
      {/* ================= Loading overlay ================= */}
      {/* {globalLoading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 2000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
          <Typography mt={2}>Đang tải dữ liệu...</Typography>
        </Box>
      )} */}
      {incomingCall && (
        <IncomingCallPopup
          guestName={incomingCall.guestName}
          callLink={incomingCall.callLink}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </Box>
  );
}
