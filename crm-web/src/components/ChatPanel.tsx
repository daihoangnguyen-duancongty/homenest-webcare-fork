import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Avatar,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import { getCurrentUser, getToken } from '../utils/auth';
import { BACKEND_URL } from '../api/fetcher';
import { useSocketStore } from '../store/socketStore';
import { useChatStore } from '../store/chatStore';
import type { UserWithOnline } from '../types/index';
import { fetchCallLink } from './../api/zaloApi';

interface ChatPanelProps {
  userId: string;
  role?: 'admin' | 'telesale';
  onLoaded?: () => void;
  onClose?: (userId: string) => void;
  onClick?: () => void;
  sx?: object;
  initialPosition?: { x: number; y: number };
}

export interface Message {
  _id: string;
  text: string;
  username: string;
  avatar?: string | null;
  assignedTelesale?: string;
  userId: string;
  senderType?: 'customer' | 'telesale' | 'admin';
  isOnline?: boolean;
}

export default function ChatPanel({
  userId,
  role,
  onLoaded,
  onClose,
  onClick,
  sx,
  initialPosition,
}: ChatPanelProps) {
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callLink, setCallLink] = useState<string | null>(null);
  const [loadingCallLink, setLoadingCallLink] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const currentUser = getCurrentUser();
  const token = getToken();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocketStore();

  const assignedTelesale = useChatStore((state) => state.assignedTelesale[userId]);
  const setAssignedTelesaleStore = useChatStore((state) => state.setAssignedTelesale);

  // ----------------- Drag & Resize -----------------
  const [position, setPosition] = useState<{ top: number; left: number }>(() => ({
    top: initialPosition?.y ?? 100,
    left: initialPosition?.x ?? 100,
  }));
  const [size, setSize] = useState({ width: 600, height: 500 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const onDragMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStartRef.current = { x: e.clientX - position.left, y: e.clientY - position.top };
  };

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setPosition({
          left: e.clientX - dragStartRef.current.x,
          top: e.clientY - dragStartRef.current.y,
        });
      }
      if (resizing) {
        setSize({
          width: Math.max(300, resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x)),
          height: Math.max(300, resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y)),
        });
      }
    };
    const onMouseUp = () => {
      setDragging(false);
      setResizing(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, resizing]);

  // ----------------- Fetch assigned telesale -----------------
  const fetchAssignedTelesale = useCallback(
    async (telesaleId: string) => {
      if (!telesaleId || assignedTelesale) return;
      try {
        const res = await axios.get<UserWithOnline>(`${BACKEND_URL}/api/users/${telesaleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignedTelesaleStore(userId, { ...res.data, isOnline: res.data.isOnline ?? false });
      } catch (err) {
        console.error('Cannot fetch assigned telesale:', err);
      }
    },
    [token, userId, assignedTelesale, setAssignedTelesaleStore]
  );

  // ----------------- Fetch messages -----------------
  const fetchMessages = useCallback(
    async (beforeId?: string) => {
      if (!userId || (!hasMore && beforeId)) return;
      setLoadingMore(true);
      try {
        const res = await axios.get<Message[]>(`${BACKEND_URL}/api/zalo/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { role, beforeId },
        });
        if (res.data.length === 0) setHasMore(false);
        setMessages((prev) => (beforeId ? [...res.data, ...prev] : res.data));

        // Fetch assigned telesale nếu chưa có
        const lastAssigned = [...res.data].reverse().find((m) => m.assignedTelesale);
        if (lastAssigned?.assignedTelesale) {
          fetchAssignedTelesale(lastAssigned.assignedTelesale);
        }

        onLoaded?.();
      } catch (err) {
        console.error(err);
        onLoaded?.();
      } finally {
        setLoadingMore(false);
      }
    },
    [userId, role, token, hasMore, onLoaded, fetchAssignedTelesale]
  );

  useEffect(() => {
    if (!assignedTelesale && messages.length > 0) {
      const lastAssigned = [...messages].reverse().find((m) => m.assignedTelesale);
      if (lastAssigned?.assignedTelesale) {
        fetchAssignedTelesale(lastAssigned.assignedTelesale);
      }
    }
  }, [messages, assignedTelesale, fetchAssignedTelesale]);

  // ----------------- Socket -----------------
  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit('join', currentUser.id);
    fetchMessages();
  }, [socket, userId, currentUser.id, fetchMessages]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      if (msg.assignedTelesale) fetchAssignedTelesale(msg.assignedTelesale);
    };
    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, fetchAssignedTelesale]);

  // ----------------- Send message -----------------
  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const payload = { userId, text };
      const res = await axios.post<{ saved: Message }>(`${BACKEND_URL}/api/zalo/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const savedMessage: Message = {
        ...res.data.saved,
        username: currentUser.username,
        avatar: currentUser.avatar,
        senderType: role === 'admin' ? 'admin' : 'telesale',
      };
      setMessages((prev) => [...prev, savedMessage]);
      setText('');
      socket?.emit('new_message', savedMessage);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && messages.length > 0 && hasMore && !loadingMore) {
      await fetchMessages(messages[0]._id);
    }
  };

  // ----------------- Call to Customer -----------------
  const handleCallClick = async () => {
    if (!userId) return;
    setLoadingCallLink(true);
    setCallStatus('Đang tạo cuộc gọi...');
    try {
      const link = await fetchCallLink(userId);
      if (!link) throw new Error('Không thể tạo link gọi Zalo');

      setCallStatus('Đang gửi tin nhắn cho khách...');
      await axios.post(
        `${BACKEND_URL}/api/zalo/send`,
        { userId, text: `📞 Mời anh/chị bấm để gọi video qua Zalo: ${link}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCallStatus('Đang mở Zalo PC...');
      const deepLink = link.replace('https://zalo.me/app/link/', 'zalo://app/link/');
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);

      setTimeout(() => {
        window.open(link, '_blank');
        document.body.removeChild(iframe);
      }, 2000);

      setCallLink(link);
      setCallStatus('✅ Đã gửi link gọi Zalo cho khách hàng');
    } catch (err) {
      console.error(err);
      setCallStatus('❌ Lỗi khi tạo hoặc gửi link gọi Zalo!');
    } finally {
      setLoadingCallLink(false);
      setTimeout(() => setCallStatus(null), 6000);
    }
  };

  // ----------------- Render -----------------
  return (
    <Paper
      onClick={() => onClick?.()}
      elevation={6}
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: size.width,
        height: size.height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: dragging ? 'none' : 'auto',
        zIndex: 100,
        ...sx,
      }}
    >
      {/* Header */}
      <Box
        onMouseDown={onDragMouseDown}
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #4e9af1 0%, #b349c3 50%, #1e3fcc 100%)',
          color: 'white',
          cursor: 'grab',
        }}
      >
        <Box display="flex" flexDirection="column" flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={1} minWidth={0}>
            <Avatar
              src={messages[0]?.avatar ?? '/default-avatar.png'}
              sx={{ width: 32, height: 32, flexShrink: 0 }}
            />
            <Typography
              noWrap
              fontWeight="bold"
              sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              {messages[0]?.username ?? 'Khách hàng'}
            </Typography>
          </Box>
          {callStatus && (
            <Typography
              variant="body2"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: '#333',
                p: 0.5,
                px: 1,
                borderRadius: 1,
                textAlign: 'center',
                fontSize: '0.8rem',
              }}
            >
              {callStatus}
            </Typography>
          )}
          <Typography variant="caption" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.8)' }}>
            Đang được chăm sóc bởi: {assignedTelesale?.username ?? 'Đang tải...'}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5} sx={{ mx: 3 }}>
          <IconButton
            size="small"
            sx={{ color: 'white' }}
            onClick={handleCallClick}
            disabled={loadingCallLink}
            title={callLink ? 'Gọi lại cuộc trước' : 'Gọi Zalo'}
          >
            {loadingCallLink ? <CircularProgress size={16} sx={{ color: 'white' }} /> : '📞'}
          </IconButton>

          <IconButton size="small" sx={{ color: 'white' }}>
            🏷️
          </IconButton>

          <Button
            size="small"
            onClick={() => onClose?.(userId)}
            sx={{
              position: 'absolute',
              top: -1,
              right: -1,
              width: 26,
              height: 26,
              minWidth: 'auto',
              padding: 0,
              color: '#eee8e8',
              '&:hover': { color: '#686262' },
            }}
          >
            X
          </Button>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        flex={1}
        p={1}
        sx={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, #e0eafc, #cfdef3)' }}
        onScroll={handleScroll}
      >
        {loadingMore && <CircularProgress size={24} sx={{ alignSelf: 'center', mb: 1 }} />}
        {messages.length === 0 ? (
          <Typography color="text.secondary">Chưa có tin nhắn nào...</Typography>
        ) : (
          messages.map((msg) => {
            const fromAdminOrTelesale = msg.senderType === 'admin' || msg.senderType === 'telesale';
            const isCustomer = !fromAdminOrTelesale;
            return (
              <MessageBubble
                key={msg._id}
                text={msg.text}
                username={msg.username}
                avatar={msg.avatar ?? undefined}
                fromAdmin={fromAdminOrTelesale}
                isOnline={!!msg.isOnline}
                align={isCustomer ? 'left' : 'right'}
                bubbleColor={isCustomer ? '#ffffff' : '#007bff'}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box display="flex" p={1} bgcolor="#f0f0f0" gap={1}>
        <TextField
          fullWidth
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          size="small"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton color="primary" onClick={sendMessage} disabled={!text.trim()}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Resize Handle */}
      <Box
        onMouseDown={onResizeMouseDown}
        sx={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, cursor: 'se-resize', bgcolor: 'rgba(0,0,0,0.2)' }}
      >
        <OpenWithIcon sx={{ fontSize: 20, color: '#999', pointerEvents: 'none' }} />
      </Box>
    </Paper>
  );
}
