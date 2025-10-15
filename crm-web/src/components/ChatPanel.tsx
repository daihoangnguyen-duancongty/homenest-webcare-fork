import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Avatar,
  Badge,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import { getCurrentUser, getToken } from '../utils/auth';
import { getTelesales } from '../api/authApi';
import { BACKEND_URL } from './../api/fetcher';

// ========================
// Socket kết nối
// ========================
const socket: Socket = io(BACKEND_URL, { transports: ['websocket'] });

// ========================
// Kiểu dữ liệu
// ========================
interface ChatPanelProps {
  userId: string;
  role?: 'admin' | 'telesale';
}

interface Message {
  _id: string;
  text: string;
  username: string;
  avatar?: string;
  assignedTelesale?: string;
  userId: string;
  senderType?: 'customer' | 'telesale' | 'admin';
  isOnline?: boolean;
}

interface TelesalesAPI {
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
}

interface Telesale {
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
}

// ========================
// Component ChatPanel
// ========================
export default function ChatPanel({ userId, role }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [telesales, setTelesales] = useState<Telesale[]>([]);
  const [selectedTelesale, setSelectedTelesale] = useState('');
  const [assignedTelesale, setAssignedTelesale] = useState<Telesale | null>(null);
  const [zaloUser, setZaloUser] = useState<{
    username: string;
    avatar?: string;
    isOnline?: boolean;
  }>({ username: 'Loading...' });

  const currentUser = getCurrentUser();
  const token = getToken();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --------------------
  // Join socket và fetch messages
  // --------------------
  useEffect(() => {
    if (!userId) return;
    socket.emit('join', currentUser.id);
    fetchMessagesAndAssignedTelesale();
    if (role === 'admin') fetchTelesales();
  }, [userId]);

  // --------------------
  // Realtime new message
  // --------------------
  useEffect(() => {
    const handleNewMessage = (msg: Message) => {
      if (msg.userId === userId || msg.senderType !== 'customer')
        setMessages((prev) => [...prev, msg]);
      if (msg.assignedTelesale) fetchAssignedTelesale(msg.assignedTelesale);
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [userId]);

  // --------------------
  // Fetch messages + last assigned telesale
  // --------------------
  async function fetchMessagesAndAssignedTelesale() {
    try {
      const res = await axios.get<Message[]>(`${BACKEND_URL}/api/zalo/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { telesaleId: currentUser.id, role },
      });
      setMessages(res.data);

      const firstMsg = res.data.find((m) => m.senderType === 'customer');
      if (firstMsg) {
        setZaloUser({
          username: firstMsg.username,
          avatar: firstMsg.avatar,
          isOnline: firstMsg.isOnline ?? false,
        });
      }

      const lastAssigned = [...res.data].reverse().find((m) => m.assignedTelesale);
      if (lastAssigned && lastAssigned.assignedTelesale) {
        fetchAssignedTelesale(lastAssigned.assignedTelesale);
      } else {
        setAssignedTelesale(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // --------------------
  // Fetch info telesale từ backend
  // --------------------
  async function fetchAssignedTelesale(telesaleId: string) {
    try {
      const res = await axios.get<Telesale>(`${BACKEND_URL}/api/users/${telesaleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedTelesale({
        id: res.data.id,
        username: res.data.username || 'Unknown',
        avatar: res.data.avatar,
        isOnline: res.data.isOnline ?? false,
      });
    } catch (err) {
      console.error(err);
    }
  }

  // --------------------
  // Fetch telesales list (admin)
  // --------------------
  async function fetchTelesales() {
    try {
      const res: TelesalesAPI[] = await getTelesales();
      setTelesales(
        res.map((t) => ({
          id: t.id,
          username: t.username,
          email: t.email || t.username || 'unknown@example.com',
          avatar: t.avatar,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  // --------------------
  // Send message
  // --------------------
  async function sendMessage() {
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
      socket.emit('new_message', savedMessage);
    } catch (err) {
      console.error(err);
    }
  }

  // --------------------
  // Assign telesale
  // --------------------
  async function assignTelesale() {
    if (!selectedTelesale || messages.length === 0) return;
    try {
      await axios.post(
        `${BACKEND_URL}/api/zalo/assign-telesale`,
        {
          messageId: messages[messages.length - 1]._id,
          telesaleId: selectedTelesale,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Đã assign telesale!');
    } catch (err) {
      console.error(err);
    }
  }

  // --------------------
  // Scroll xuống cuối
  // --------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --------------------
  // Render
  // --------------------
  return (
    <Paper
      elevation={5}
      sx={{
        height: '80vh',
        width: '90vw',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to bottom, #f0f8ff, #d0e8ff)',
      }}
    >
      {/* Header user */}
      <Box
        p={1}
        display="flex"
        alignItems="center"
        borderRadius={2}
        sx={{
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #fad0c4 100%)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <Badge
          variant="dot"
          color="success"
          overlap="circular"
          invisible={!zaloUser.isOnline}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Avatar src={zaloUser.avatar} alt={zaloUser.username} />
        </Badge>
        <Typography ml={2} fontWeight="bold" color="#fff">
          {zaloUser.username}
        </Typography>
        {assignedTelesale && (
          <Typography ml={4} fontSize="0.8rem" color="white">
            Assigned: {assignedTelesale.username}
          </Typography>
        )}
      </Box>

      {/* Chat messages scrollable */}
      <Box flex={1} p={1} sx={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                avatar={msg.avatar}
                fromAdmin={fromAdminOrTelesale}
                isOnline={!!msg.isOnline}
                align={isCustomer ? 'right' : 'left'}
                bubbleColor={isCustomer ? '#ffffff' : '#007bff'}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Form gửi tin nhắn cố định */}
      <Box
        display="flex"
        alignItems="center"
        p={1}
        mt={1}
        bgcolor="#f0f0f0"
        borderRadius={3}
        gap={1}
      >
        <TextField
          fullWidth
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            '& .MuiOutlinedInput-root': { borderRadius: 3 },
          }}
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
    </Paper>
  );
}
