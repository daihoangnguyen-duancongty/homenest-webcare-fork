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
import OutgoingCallPopup from './CallPopup/OutgoingCallPopup';
import { getCurrentUser, getToken } from '../utils/auth';
import { BACKEND_URL } from '../config/fetchConfig';
import { useSocketStore } from '../store/socketStore';
import { useChatStore } from '../store/chatStore';
import type { UserWithOnline } from '../types/index';
import { useAgoraCall } from '../hooks/useAgoraCall';

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
  // call state
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [loadingCallLink, setLoadingCallLink] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState(false);
  const [callDuration, setCallDuration] = useState<number>(0); 
const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const currentUser = getCurrentUser();
  const token = getToken();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { socket, disconnectSocket } = useSocketStore();

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
  // ----------------- Cleanup socket on unmount -----------------
  useEffect(() => {
    return () => {
      socket?.emit('leave', currentUser.id);
    };
  }, []);

  // ----------------- Mouse move & up listeners -----------------
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
          width: Math.max(
            300,
            resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x)
          ),
          height: Math.max(
            300,
            resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y)
          ),
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
  //tạo biến fallback tránh lỗi crash khi messages[0] la undefined
  const firstMessage = messages[0] ?? { username: 'Khách hàng', avatar: '/default-avatar.png' };

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
      const fixedMsg = {
        ...msg,
        avatar: msg.avatar || '/default-avatar.png', // fallback avatar
      };

      setMessages((prev) => [...prev, fixedMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      if (fixedMsg.assignedTelesale) fetchAssignedTelesale(fixedMsg.assignedTelesale);
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
        avatar: currentUser.avatar || '/default-avatar.png', // fallback avatar
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

  //----------------- Telesale call to Customer -----------------

  // Audio call
  const { callData, isCalling, startCall, stopCall, forceStopCall } = useAgoraCall(
    userId,
    role === 'telesale' ? 'telesale' : 'guest'
  );

  // Thêm hàm map status -> emoji
  function getCallEmoji(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('đang gọi') || s.includes('đổ chuông')) return '📲'; // đang đổ chuông
    if (s.includes('thành công') || s.includes('connected')) return '📞'; // gọi được
    if (s.includes('kết thúc') || s.includes('ended')) return '📴'; // kết thúc
    if (s.includes('ngắt kết nối') || s.includes('disconnect')) return '🔕'; // ngắt kết nối
    if (s.includes('thất bại') || s.includes('fail')) return '📵'; // thất bại
    if (s.includes('bị hủy') || s.includes('cancel')) return '❌'; // hủy
    return '☎️'; // fallback
  }
  // Khi kết thúc hoặc hủy call
  const handleCallEnd = async (status: string, callerName?: string) => {
    const lower = status.toLowerCase();
    if (
      [
        'kết thúc',
        'ended',
        'ngắt kết nối',
        'disconnect',
        'thất bại',
        'fail',
        'bị hủy',
        'cancel',
      ].some((s) => lower.includes(s))
    ) {
      await forceStopCall(); // 🔹 Giải phóng mic/audio ngay lập tức
    } else {
      await stopCall(); // Trường hợp bình thường
    }

    setOutgoingCall(false);
    setCallStatus(null);

    const emoji = getCallEmoji(status);
    const logMsg: Message = {
      _id: `${Date.now()}`,
      text: `${emoji} ${status}`,
      username: callerName || currentUser.username || 'Hệ thống',
      avatar: currentUser.avatar || '/default-avatar.png',
      senderType: role === 'admin' ? 'admin' : 'telesale',
      userId: userId ?? 'unknown',
    };

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/zalo/send`,
        {
          userId,
          text: logMsg.text,
          senderType: logMsg.senderType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const saved = { ...res.data.saved, avatar: logMsg.avatar };
      setMessages((prev) => [...prev, saved]);
      socket?.emit('new_message', saved);
    } catch {
      setMessages((prev) => [...prev, logMsg]);
      socket?.emit('new_message', logMsg);
    }
  };
  // Bắt đầu cuộc gọi
  const handleCallClick = async () => {
    if (callTimerRef.current) {
  clearInterval(callTimerRef.current);
  callTimerRef.current = null;
}
setCallDuration(0);

    try {
      setOutgoingCall(true);
      setCallStatus('Đang kết nối...');
      setLoadingCallLink(true);

      // Bắt đầu cuộc gọi
      await startCall();

      // Cập nhật trạng thái sau khi join thành công
      setCallStatus('Đang gọi khách hàng...');
// 🟢 Bắt đầu đếm thời gian
setCallDuration(0);
if (callTimerRef.current) clearInterval(callTimerRef.current);
callTimerRef.current = setInterval(() => {
  setCallDuration((prev) => prev + 1);
}, 1000);
      // ❌ Không gọi handleCallEnd ngay nữa
    } catch (err) {
      setCallStatus('Lỗi khi bắt đầu cuộc gọi');
      console.error(err);
      handleCallEnd('Cuộc gọi thất bại');
      if (callTimerRef.current) {
  clearInterval(callTimerRef.current);
  callTimerRef.current = null;
}
setCallDuration(0);

    } finally {
      setLoadingCallLink(false);
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
              src={firstMessage.avatar ?? '/default-avatar.png'}
              sx={{ width: 32, height: 32, flexShrink: 0 }}
            />

            <Typography>{firstMessage.username}</Typography>
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
      display: 'inline-block',
      mt: 0.5,
    }}
  >
    {callStatus.includes('Đang gọi')
      ? `${callStatus} (${String(Math.floor(callDuration / 60)).padStart(2, '0')}:${String(
          callDuration % 60
        ).padStart(2, '0')})`
      : callStatus}
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
            disabled={isCalling || loadingCallLink}
            title={callData ? 'Gọi lại cuộc trước' : 'Gọi Zalo'}
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
        sx={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(to bottom, #e0eafc, #cfdef3)',
        }}
        onScroll={handleScroll}
      >
        {loadingMore && <CircularProgress size={24} sx={{ alignSelf: 'center', mb: 1 }} />}
        {messages.length === 0 ? (
          <Typography color="text.secondary">Chưa có tin nhắn nào...</Typography>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={`${msg._id}-${index}`}
              text={msg.text}
              username={msg.username}
              avatar={msg.avatar ?? undefined}
              fromAdmin={msg.senderType === 'admin' || msg.senderType === 'telesale'}
              isOnline={!!msg.isOnline}
              align={msg.senderType === 'admin' || msg.senderType === 'telesale' ? 'right' : 'left'}
              bubbleColor={
                msg.senderType === 'admin' || msg.senderType === 'telesale' ? '#007bff' : '#fff'
              }
            />
          ))
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
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 24,
          height: 24,
          cursor: 'se-resize',
          bgcolor: 'rgba(0,0,0,0.2)',
        }}
      >
        <OpenWithIcon sx={{ fontSize: 20, color: '#999', pointerEvents: 'none' }} />
      </Box>
      {/* OutgoingCall */}
      {outgoingCall && (
        <OutgoingCallPopup
          guestName={firstMessage.username}
          onCancel={() => {
            forceStopCall();
            setOutgoingCall(false);
            setCallStatus('Cuộc gọi bị hủy');
            handleCallEnd('Cuộc gọi bị hủy bởi telesale');
          }}
        />
      )}
    </Paper>
  );
}
