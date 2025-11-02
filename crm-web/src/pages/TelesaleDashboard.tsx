import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Sidebar from './../components/sidebar/Sidebar';
import Header from '../components/Header';
import ChatPanel from './../components/ChatPanel';
import IncomingCallPopup from '../components/IncomingCallPopup';
import { getCurrentUser } from '../utils/auth';
import { fetchConversations } from './../api/adminApi';
import { useSocketStore } from '../store/socketStore';
import { toast } from 'react-toastify';

export default function TelesaleDashboard() {
  // call
  const [incomingCall, setIncomingCall] = useState<{ guestName: string; callLink: string } | null>(
    null
  );
  //chat
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<
    'chat' | 'employee' | 'customer' | 'automation' | 'reports'
  >('chat');
  const [chatPositions, setChatPositions] = useState<Record<string, { x: number; y: number }>>({});

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const CHAT_DEFAULT_WIDTH = 600;
  const CHAT_DEFAULT_HEIGHT = 500;
  // vi tri ban dau cua coversation luc xuat hien
  const getCenterPosition = () => {
    const x = window.innerWidth / 2 - CHAT_DEFAULT_WIDTH / 2;
    const y = window.innerHeight / 2 - CHAT_DEFAULT_HEIGHT / 2;
    return { x, y };
  };
  const user = getCurrentUser();
  const role = user?.role || 'telesale';
  // mo nhieu chat cung luc
  const handleOpenChat = (userId: string) => {
    setOpenChats((prev) => {
      if (!prev.includes(userId)) {
        const lastUserId = prev[prev.length - 1];
        const lastPos =
          lastUserId && chatPositions[lastUserId] ? chatPositions[lastUserId] : getCenterPosition(); // fallback về giữa màn hình

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
  //---------------- Lắng nghe sự kiện inbound_call từ socket (khách gọi đến crm) ----------------
  useEffect(() => {
    if (!socket) return;

    const handleInboundCall = (data: any) => {
      console.log('📞 inbound_call data received:', data);
      setIncomingCall({ guestName: data.guestName || 'Khách hàng', callLink: data.callLink });
    };

    socket.on('inbound_call', handleInboundCall);

    return () => {
      socket.off('inbound_call', handleInboundCall);
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
                role="telesale"
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
      </Box>
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
