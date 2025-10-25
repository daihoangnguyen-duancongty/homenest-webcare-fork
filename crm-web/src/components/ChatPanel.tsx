import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Avatar,
  Badge,
  Paper,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import { getCurrentUser, getToken } from '../utils/auth';
import { BACKEND_URL } from './../api/fetcher';

interface ChatPanelProps {
  userId: string;
  role?: 'admin' | 'telesale';
  onLoaded?: () => void;
}

interface Message {
  _id: string;
  text: string;
  username: string;
  avatar?: string | null;
  assignedTelesale?: string;
  userId: string;
  senderType?: 'customer' | 'telesale' | 'admin';
  isOnline?: boolean;
}

interface Telesale {
  id: string;
  username?: string;
  email?: string;
  avatar?: string | null;
  isOnline?: boolean;
}

// **Socket global duy nhất**
const socket: Socket = io(BACKEND_URL, { transports: ['websocket'] });

export default function ChatPanel({ userId, role, onLoaded }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [assignedTelesale, setAssignedTelesale] = useState<Telesale | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const currentUser = getCurrentUser();
  const token = getToken();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages + assigned telesale
  const fetchMessages = useCallback(async (beforeId?: string) => {
    if (!userId) return;
    if (!hasMore && beforeId) return; // không còn tin nhắn cũ

    setLoadingMore(true);
    try {
      const res = await axios.get<Message[]>(`${BACKEND_URL}/api/zalo/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { role, beforeId },
      });

      if (res.data.length === 0) setHasMore(false);

      setMessages(prev => beforeId ? [...res.data, ...prev] : res.data);

      // Lấy last assigned telesale
      if (!beforeId && res.data.length > 0) {
        const lastAssigned = [...res.data].reverse().find(m => m.assignedTelesale);
        if (lastAssigned && lastAssigned.assignedTelesale) {
          await fetchAssignedTelesale(lastAssigned.assignedTelesale);
        }
      }

      onLoaded?.();
    } catch (err) {
      console.error(err);
      onLoaded?.();
    } finally {
      setLoadingMore(false);
    }
  }, [userId, role, token, hasMore]);

  // Fetch assigned telesale
  const fetchAssignedTelesale = async (telesaleId: string) => {
    try {
      const res = await axios.get<Telesale>(`${BACKEND_URL}/api/users/${telesaleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedTelesale({
        id: res.data.id,
        username: res.data.username || 'Unknown',
        avatar: res.data.avatar ?? null,
        isOnline: res.data.isOnline ?? false,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Join socket + fetch messages lần đầu
  useEffect(() => {
    if (!userId) return;
    socket.emit('join', currentUser.id);
    fetchMessages();
  }, [userId, fetchMessages]);

  // Lắng nghe tin nhắn realtime
  useEffect(() => {
    const handleNewMessage = (msg: Message) => {
      if (msg.userId === userId || msg.senderType !== 'customer') {
        setMessages(prev => [...prev, msg]);
        // Scroll xuống cuối khi có tin nhắn mới
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [userId]);

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const payload = { userId, text };
      const res = await axios.post<{ saved: Message }>(`${BACKEND_URL}/api/zalo/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const savedMessage: Message = { ...res.data.saved, username: currentUser.username, avatar: currentUser.avatar, senderType: role === 'admin' ? 'admin' : 'telesale' };
      setMessages(prev => [...prev, savedMessage]);
      setText('');
      socket.emit('new_message', savedMessage);
    } catch (err) {
      console.error(err);
    }
  };

  // Scroll event để load thêm tin nhắn cũ
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (top === 0 && messages.length > 0 && hasMore && !loadingMore) {
      const oldestId = messages[0]._id;
      await fetchMessages(oldestId);
    }
  };

  return (
    <Paper elevation={5} sx={{ marginTop: '13vh', height: '80vh', width: '90vw', borderRadius: 3, display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, #f0f8ff, #d0e8ff)' }}>
      {/* Header */}
      <Box p={1} display="flex" alignItems="center" borderRadius={2} sx={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #fad0c4 100%)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
        <Badge variant="dot" color="success" overlap="circular" invisible={!assignedTelesale?.isOnline} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Avatar src={assignedTelesale?.avatar ?? undefined} alt={assignedTelesale?.username} />
        </Badge>
        <Typography ml={2} fontWeight="bold" color="#fff">{assignedTelesale?.username || 'Loading...'}</Typography>
      </Box>

      {/* Chat messages scrollable */}
      <Box
        flex={1}
        p={1}
        sx={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {loadingMore && <CircularProgress size={24} sx={{ alignSelf: 'center', mb: 1 }} />}
        {messages.length === 0 ? (
          <Typography color="text.secondary">Chưa có tin nhắn nào...</Typography>
        ) : (
          messages.map(msg => {
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

      {/* Form gửi tin nhắn */}
      <Box display="flex" alignItems="center" p={1} mt={1} bgcolor="#f0f0f0" borderRadius={3} gap={1}>
        <TextField
          fullWidth
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ bgcolor: 'white', borderRadius: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
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
    </Paper>
  );
}
