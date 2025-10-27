import { useState,useEffect } from 'react';
import { Box } from '@mui/material';
import Sidebar from './../components/sidebar/Sidebar';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import { getCurrentUser } from '../utils/auth';
import { fetchConversations } from './../api/adminApi';
import { useSocketStore } from '../store/socketStore';
import { toast } from 'react-toastify';

export default function TelesaleDashboard() {
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<'chat' | 'employee' | 'automation' | 'reports'>(
    'chat'
  );
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const user = getCurrentUser();
  const role = user?.role || 'telesale';
  // mo nhieu chat cung luc
    const handleOpenChat = (userId: string) => {
    setOpenChats((prev) => {
      if (!prev.includes(userId)) return [...prev, userId];
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
      </Box>
    </Box>
  );
}
