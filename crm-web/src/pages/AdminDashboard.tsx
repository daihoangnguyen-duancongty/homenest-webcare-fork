import { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './../components/sidebar/Sidebar';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import EmployeePanel from '../components/EmployeePanel';
import type { ModuleKey } from './../components/sidebar/Sidebar';
import { fetchConversations } from './../api/adminApi';
import { useSocketStore } from '../store/socketStore';
import { getCurrentUser } from '../utils/auth';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
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
      const lastPos = lastUserId
        ? chatPositions[lastUserId]
        : getCenterPosition(); // <-- center nếu chat đầu tiên
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
  const { socket, initSocket } = useSocketStore();
  const currentUser = getCurrentUser();

useEffect(() => {
  initSocket();
}, [initSocket]);

    // ---------------- Mở conversation mới nhất khi load ----------------
  useEffect(() => {
    (async () => {
      try {
        const conversations = await fetchConversations();
        if (conversations.length > 0) {
          const latest = conversations[0]; // mặc định lấy conversation mới nhất
          handleOpenChat(latest.userId);
        }
      } catch (err) {
        console.error('Cannot fetch conversations on load:', err);
      }
    })();
  }, []);
  //---------------- Mở cuộc gọi từ khách hàng đến crm ----------------
useEffect(() => {
  if (!socket) return;

  socket.on("inbound_call", (data) => {
    console.log("📞 Cuộc gọi đến:", data);

    if (
      (currentUser.role === "admin" && data.targetRole === "admin") ||
      (currentUser.role === "telesale" && data.targetUserId === currentUser.id)
    ) {
      toast.info(`📞 Khách hàng ${data.guestName} đang gọi đến!`, {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        onClick: () => {
          window.open(data.callLink, "_blank");
        },
      });
    }
  });

  return () => {
    socket.off("inbound_call");
  };
}, [socket, currentUser]);
 //---------------- Lắng nghe sự kiện inbound_call từ socket (khách gọi đến crm) ----------------
useEffect(() => {
  if (!socket) return;

  const handleInboundCall = (data: any) => {
    console.log("📞 Cuộc gọi đến:", data);

    if (
      (currentUser.role === "admin" && data.targetRole === "admin") ||
      (currentUser.role === "telesale" && data.targetUserId === currentUser.id)
    ) {
      toast.info(`📞 Khách hàng ${data.guestName} đang gọi đến!`, {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        onClick: () => {
          window.open(data.callLink, "_blank");
        },
      });
    }
  };

  // 👉 Lắng nghe sự kiện inbound_call
  socket.on("inbound_call", handleInboundCall);

  // 👉 Cleanup đúng kiểu
  return () => {
    socket.off("inbound_call", handleInboundCall);
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
        {activeModule === 'chat' &&
          openChats.map((userId, idx) => {
            const isActive = activeChat === userId;
            return (
              <ChatPanel
                key={userId}
                userId={userId}
                role="admin"
                  initialPosition={chatPositions[userId]}
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
