import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  Typography,
  Avatar,
  Tooltip,
  Skeleton,
  Button,
  Paper,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
  ClickAwayListener,
  useMediaQuery,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import AssessmentIcon from '@mui/icons-material/Assessment';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import DehazeIcon from '@mui/icons-material/Dehaze';
import { keyframes } from '@mui/system';
import type { Conversation } from './../../types';
import { fetchConversations } from './../../api/adminApi';
import { assignTelesale } from './../../api/zaloApi';
import { getTelesales, type Telesales } from './../../api/authApi';
import { getToken } from './../../utils/auth';
import { BASE_URL } from './../../api/zaloApi';
import { useSocketStore } from '../../store/socketStore';
import type { UserOnlinePayload, NewMessagePayload } from '../../types/socket';
import type { Message } from '../../types/index';
import SearchBar from "./../SearchBar";
import { Mic } from "@mui/icons-material";
import SortFilter from "./../SortFilter";
import LabelDialog from "../LabelDialog";

export type ModuleKey = 'chat' | 'employee' | 'automation' | 'reports';

export interface SidebarProps {
  onSelectUser: (userId: string) => void;
  setActiveModule: (module: ModuleKey) => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  role?: 'admin' | 'telesale';
  mobileOpen?: boolean;
  setMobileOpen?: (val: boolean) => void;
}

export interface ConversationWithAssign extends Conversation {
  isAssignMenuOpen?: boolean;
  showAssignSubmenu?: boolean;
  messages: Message[];
  unreadCount?: number;
  hasNewMessage?: boolean;
  avatarUrl?: string;
  isOnline?: boolean;
  lastInteraction?: string;
}

const blink = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.15); }
  50% { transform: scale(1); }
  75% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

export default function Sidebar({
  onSelectUser,
  setActiveModule,
  isExpanded,
  setIsExpanded,
  role = 'telesale',
}: SidebarProps) {
  // dùng zutand quản lý socket
  const { socket, isConnected } = useSocketStore();
  //tim kiem
  const [query, setQuery] = useState("");
  //sort
  const [filter, setFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  //lable
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
const [availableLabels, setAvailableLabels] = useState<string[]>([
  "Khách tiềm năng",
  "Đã mua",
  "Quan tâm",
]);


  //
  const [conversations, setConversations] = useState<ConversationWithAssign[]>([]);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ModuleKey>('chat');
  const [loading, setLoading] = useState<boolean>(false);
  const [telesales, setTelesales] = useState<Telesales[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedConversation, setSelectedConversation] = useState<ConversationWithAssign | null>(
    null
  );
  const [selectedTelesale, setSelectedTelesale] = useState<Telesales | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  // state style

  const isMobile = useMediaQuery('(max-width:768px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  // Load telesales
  useEffect(() => {
    const loadTelesales = async () => {
      try {
        const data: Telesales[] = await getTelesales();
        const mapped = data.map((t: Partial<Telesales> & { _id?: string; id?: string }) => ({
          _id: t._id ?? t.id ?? '',
          username: t.username || t.name || '',
          avatar: t.avatar || '',
        })) as Telesales[];

        setTelesales(mapped);
      } catch (err) {
        console.error('Failed to load telesales', err);
      }
    };
    loadTelesales();
  }, []);

  // Load conversations
  const loadConversations = async (pageNumber = 1) => {
    if (!hasMore && pageNumber !== 1) return;
    try {
      setLoading(true);
      const data = await fetchConversations();
      const convWithAssign: ConversationWithAssign[] = data.map(
        (
          c: Partial<ConversationWithAssign> & {
            username?: string;
            avatar?: string;
            unreadCount?: number;
            userId?: string;
            lastMessage?: string;
          }
        ) => ({
          ...c,
          userId: c.userId ?? '',
          isAssignMenuOpen: false,
          messages: c.messages ?? [],
          unreadCount: c.unreadCount ?? 0,
          hasNewMessage: (c.unreadCount ?? 0) > 0,
          name: c.username,
          avatarUrl: c.avatar,
          lastMessage: c.lastMessage ?? '',
          lastInteraction: c.lastInteraction,
        })
      );

      let filteredData = convWithAssign;
      if (role === 'telesale') {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        filteredData = convWithAssign.filter((c) => c.assignedTelesale?.toString() === user._id);
      }

      if (pageNumber === 1) setConversations(filteredData);
      else setConversations((prev) => [...prev, ...filteredData]);

      if (filteredData.length === 0) setHasMore(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadConversations(1);
  }, [role]);
  // Kết nối socket và lắng nghe sự kiện realtime -> nhan du kieu tu store zustand
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🟢 Sidebar subscribing to realtime events...');

    const handleUserOnline = ({ userId, isOnline }: UserOnlinePayload) => {
      console.log('👤 user_online:', userId, isOnline);
      setConversations((prev) =>
        prev.map((conv) => (conv.userId === userId ? { ...conv, isOnline } : conv))
      );
    };

    const handleNewMessage = ({ userId, message, lastInteraction }: NewMessagePayload) => {
      setConversations((prev) =>
        prev
          .map((conv) =>
            conv.userId === userId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    { ...message, _id: (message as Message)._id ?? Date.now().toString() },
                  ],
                  unreadCount: conv.userId === activeUser ? 0 : (conv.unreadCount || 0) + 1,
                  hasNewMessage: conv.userId !== activeUser,
                  lastInteraction,
                }
              : conv
          )
          .sort(
            (a, b) =>
              new Date(b.lastInteraction ?? 0).getTime() -
              new Date(a.lastInteraction ?? 0).getTime()
          )
      );
    };

    socket.on('user_online', handleUserOnline);
    socket.on('new_message', handleNewMessage);

    return () => {
      console.log('🔴 Sidebar unsubscribing from realtime events...');
      socket.off('user_online', handleUserOnline);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, activeUser]);

  // Handle selecting a user
  const handleSelectUser = async (c: ConversationWithAssign) => {
    setActiveUser(c.userId);
    onSelectUser(c.userId);
    // Nếu đang ở mobile, đóng sidebar
    if (isMobile) setMobileOpen(false);
    // 👇 Gọi API backend để set read=true
    const token = getToken();
    await fetch(`${BASE_URL}/messages/${c.userId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    // 👇 Cập nhật local state (reset unreadCount)
    setConversations((prev) =>
      prev.map((conv) =>
        conv.userId === c.userId ? { ...conv, unreadCount: 0, hasNewMessage: false } : conv
      )
    );

    try {
      const res = await fetch(`/api/messages/${c.userId}`);
      const msgs: Message[] = await res.json();
      const updatedMsgs = msgs.map((m) => ({ ...m, read: true }));
      setConversations((prev) =>
        prev.map((conv) => (conv.userId === c.userId ? { ...conv, messages: updatedMsgs } : conv))
      );
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10 && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadConversations(nextPage);
    }
  };
  //sort
  const handleFilterChange = (value: string) => {
    console.log("Đang lọc theo:", value);
    setFilter(value);
  };

  const handleSortChange = (order: "asc" | "desc") => {
    console.log("Thay đổi sắp xếp:", order);
    setSortOrder(order);
  };

  const handleClear = () => {
    setFilter("");
    setSortOrder("asc");
  };
  //
  const allMenuItems: { key: ModuleKey; icon: ReactNode; label: string; roles: string[] }[] = [
    { key: 'chat', icon: <ChatIcon />, label: 'Quản lý trò chuyện', roles: ['admin', 'telesale'] },
    { key: 'employee', icon: <GroupIcon />, label: 'Quản lý nhân viên', roles: ['admin'] },
    { key: 'automation', icon: <AutoModeIcon />, label: 'Automation', roles: ['admin'] },
    { key: 'reports', icon: <AssessmentIcon />, label: 'Báo cáo', roles: ['admin'] },
  ];
  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  const displayName =
    selectedConversation?.name ||
    selectedConversation?.messages[0]?.username ||
    selectedConversation?.userId;

  return (
    <>
      {/* Desktop Sidebar (giữ nguyên logic cũ) */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',

            width: isExpanded ? 280 : 60,
            bgcolor: '#4159c7',
            color: 'white',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxShadow: 4,
            zIndex: 3000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header + Toggle */}
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'space-between' : 'center',
              background: 'linear-gradient(90deg, #eef7f3, #cfd1d6)',
              height: 64,
              flexShrink: 0,
            }}
          >
            {isExpanded ? (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#1a237e',
                  letterSpacing: 0.5,
                  whiteSpace: 'nowrap',
                }}
              >
                HOMENEST CRM
              </Typography>
            ) : (
              <img
                src="https://homenest.com.vn/wp-content/uploads/2024/12/logo-HN-final-07-1.png"
                alt="Logo"
                style={{ width: 80, height: 80 }}
              />
            )}

            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                position: 'fixed',
                top: '9vh',
                left: isExpanded ? '14vw' : '2.4vw',
                zIndex: 2000,
                color: '#1a237e',
                backgroundColor: '#eef7f3',
                boxShadow: 3,
                border: '2px solid #cfd1d6',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: !isExpanded ? `${heartbeat} 1.8s infinite ease-in-out` : 'none',
                '&:hover': {
                  transform: 'scale(1.2)',
                  color: '#283593',
                  backgroundColor: '#fff',
                },
              }}
            >
              {isExpanded ? (
                <KeyboardDoubleArrowLeftIcon fontSize="medium" />
              ) : (
                <KeyboardDoubleArrowRightIcon fontSize="medium" />
              )}
            </IconButton>
          </Box>

          {/* Menu */}
          <List sx={{ flexShrink: 0, px: 0, mt: 2 }}>
            {menuItems.map((item) => (
              <Tooltip key={item.key} title={!isExpanded ? item.label : ''} placement="right" arrow>
                <ListItemButton
                  selected={activeSection === item.key}
                  onClick={() => {
                    setActiveSection(item.key);
                    setActiveModule(item.key);
                    setMobileOpen(false); // Đóng sidebar sau khi chọn
                  }}
                  sx={{
                    borderRadius: 2,
                    color: activeSection === item.key ? 'white' : 'rgba(255,255,255,0.7)',
                    bgcolor: activeSection === item.key ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor:
                        activeSection === item.key ? 'primary.dark' : 'rgba(255,255,255,0.15)',
                    },
                    transition: 'all 0.3s ease',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    mb: 0.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: 'inherit',
                      justifyContent: 'center',
                      mr: isExpanded ? 2 : 0,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {isExpanded && <Typography fontWeight={600}>{item.label}</Typography>}
                </ListItemButton>
              </Tooltip>
            ))}
          </List>

          {/* Divider */}
          {isExpanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, my: 1.5 }}>
              <Box
                sx={{
                  flex: 1,
                  height: 1.5,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg, #6a11cb, #2575fc)',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  mx: 1.5,
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Cuộc hội thoại gần đây
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 1.5,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg, #6a11cb, #2575fc)',
                }}
              />
              
            </Box>
          )}
              {/* SearchBar */}
   <div style={{ padding: 20, maxWidth: 400 }}>
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        onSearch={(val) => console.log("Search:", val)}
        placeholder="Tìm kiếm bạn bè, tin nhắn..."
        rightIcon={<Mic fontSize="small" />}
        bgcolor="#f1f3f4"
        radius={30}
      />
    </div>
        <SortFilter
        filters={[
          { label: "Tên người dùng", value: "username" },
          { label: "Nhãn", value: "label" },
          { label: "Ngày tham gia", value: "joined" },
        ]}
        selectedFilter={filter}
        sortOrder={sortOrder}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onClear={handleClear}
        sx={{ maxWidth: 400 }}
      />
          {/* Conversations */}
          {isExpanded && activeSection === 'chat' && (
            <Box sx={{ flex: 1, overflowY: 'auto', mt: 0.5 }} onScroll={handleScroll}>
              {loading &&
                page === 1 &&
                Array.from(new Array(6)).map((_, idx) => (
                  <ListItemButton key={idx} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
                    <Skeleton variant="circular" width={36} height={36} sx={{ mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" height={20} />
                      <Skeleton width="80%" height={16} sx={{ mt: 0.5 }} />
                    </Box>
                  </ListItemButton>
                ))}

              {conversations.length === 0 && !loading && (
                <Typography color="grey.400" sx={{ p: 2 }}>
                  Không có hội thoại
                </Typography>
              )}

              {conversations.map((c) => (
                <ListItemButton
                  key={c.userId}
                  selected={activeUser === c.userId}
                  onClick={() => handleSelectUser(c)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    p: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.main' },
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  {/* Avatar + Text */}
                  <Box display="flex" alignItems="center" flex="1" minWidth={0}>
                    <Box sx={{ position: 'relative', mr: 2 }}>
                      <Avatar src={c.avatarUrl ?? ''} sx={{ width: 40, height: 40 }} />

                      {c.isOnline && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 10,
                            height: 10,
                            bgcolor: '#4caf50',
                            borderRadius: '50%',
                            border: '2px solid white',
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{ fontWeight: c.unreadCount ? 700 : 600, color: 'inherit' }}
                      >
                        {c.name || c.userId}
                      </Typography>
                      <Typography
                        noWrap
                        variant="body2"
                        color={c.unreadCount ? 'white' : 'grey.400'}
                        sx={{ fontWeight: c.unreadCount ? 600 : 400 }}
                      >
                        {c.lastMessage || '...'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Badge */}
                  {c.unreadCount ? (
                    <Box
                      sx={{
                        ml: 1,
                        bgcolor: 'error.main',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        animation: c.hasNewMessage ? `${blink} 0.5s ease-in-out` : 'none',
                      }}
                    >
                      {c.unreadCount}
                    </Box>
                  ) : null}

                  {/* Admin Assign Button */}
                  {role === 'admin' && (
                    <Box sx={{ ml: 1, position: 'relative', flexShrink: 0 }}>
                      <ClickAwayListener
                        onClickAway={() =>
                          setConversations((prev) =>
                            prev.map((conv) => ({
                              ...conv,
                              isAssignMenuOpen: false,
                              showAssignSubmenu: false,
                            }))
                          )
                        }
                      >
                        {/* Nut ba cham */}
                        <Box>
                          <Button
                            size="small"
                            variant="text"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversations((prev) =>
                                prev.map((conv) => {
                                  if (conv.userId === c.userId) {
                                    const isOpen = conv.isAssignMenuOpen || conv.showAssignSubmenu;
                                    return {
                                      ...conv,
                                      isAssignMenuOpen: !isOpen && !conv.showAssignSubmenu,
                                      showAssignSubmenu: false,
                                    };
                                  }
                                  return {
                                    ...conv,
                                    isAssignMenuOpen: false,
                                    showAssignSubmenu: false,
                                  };
                                })
                              );
                            }}
                            sx={{
                              minWidth: 32,
                              p: 0.5,
                              borderRadius: '50%',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.2)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </Button>

                          {c.isAssignMenuOpen && (
                            <Paper
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                position: 'absolute',
                                top: '36px',
                                right: 0,
                                zIndex: 10,
                                borderRadius: 2,
                                boxShadow: 6,
                                overflow: 'hidden',
                              }}
                            >
                              <MenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversations((prev) =>
                                    prev.map((conv) =>
                                      conv.userId === c.userId
                                        ? {
                                            ...conv,
                                            showAssignSubmenu: true,
                                            isAssignMenuOpen: false,
                                          }
                                        : {
                                            ...conv,
                                            showAssignSubmenu: false,
                                            isAssignMenuOpen: false,
                                          }
                                    )
                                  );
                                }}
                              >
                                Phân công
                              </MenuItem>
                              <MenuItem onClick={(e) => e.stopPropagation()}>Xóa</MenuItem>
                              <MenuItem
  onClick={(e) => {
    e.stopPropagation();
    setSelectedConversation(c);
    setIsLabelDialogOpen(true);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.userId === c.userId
          ? { ...conv, isAssignMenuOpen: false, showAssignSubmenu: false }
          : conv
      )
    );
  }}
>
  Gắn nhãn
</MenuItem>

                            </Paper>
                          )}

                          {c.showAssignSubmenu && telesales.length > 0 && (
                            <Paper
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                position: 'absolute',
                                top: '36px',
                                right: 0,
                                zIndex: 11,
                                borderRadius: 2,
                                boxShadow: 6,
                                maxHeight: 200,
                                overflowY: 'auto',
                              }}
                            >
                              {telesales.map((t) => (
                                <MenuItem
                                  key={t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedConversation(c);
                                    setSelectedTelesale(t);
                                    setIsConfirmOpen(true);
                                    setConversations((prev) =>
                                      prev.map((conv) =>
                                        conv.userId === c.userId
                                          ? { ...conv, showAssignSubmenu: false }
                                          : conv
                                      )
                                    );
                                  }}
                                >
                                  <Avatar src={t.avatar} sx={{ width: 24, height: 24, mr: 1 }} />
                                  {t.username}
                                </MenuItem>
                              ))}
                            </Paper>
                          )}
                        </Box>
                      </ClickAwayListener>
                    </Box>
                  )}
                </ListItemButton>
              ))}
            </Box>
          )}

          {/* Dialog confirm */}
          <Dialog
            open={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            sx={{ zIndex: 2600 }}
          >
            <DialogTitle>Xác nhận phân công</DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc muốn phân công cho <strong>{selectedTelesale?.username}</strong> cho{' '}
                <strong>{selectedConversation?.name}</strong>?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsConfirmOpen(false)}>Hủy</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!selectedConversation || !selectedTelesale) return;
                  try {
                    await assignTelesale(selectedConversation.userId, selectedTelesale._id);
                    setConversations((prev) =>
                      prev.map((conv) =>
                        conv.userId === selectedConversation.userId
                          ? { ...conv, isAssignMenuOpen: false }
                          : conv
                      )
                    );
                    setToast({
                      open: true,
                      message: `✅ Đã phân công ${selectedTelesale.username} cho ${displayName}`,
                    });
                  } catch (err) {
                    console.error(err);
                    setToast({ open: true, message: '❌ Assign failed' });
                  } finally {
                    setIsConfirmOpen(false);
                  }
                }}
              >
                Xác nhận
              </Button>
            </DialogActions>
          </Dialog>
          {/* LabelDialog */}
<LabelDialog
  open={isLabelDialogOpen}
  onClose={() => setIsLabelDialogOpen(false)}
  selectedConversation={selectedConversation || undefined}
  availableLabels={availableLabels}
  setAvailableLabels={setAvailableLabels}
  onSave={(label) => {
    if (!selectedConversation) return;
    setConversations((prev) =>
      prev.map((conv) =>
        conv.userId === selectedConversation.userId
          ? { ...conv, label }
          : conv
      )
    );
    setToast({
      open: true,
      message: `✅ Đã gắn nhãn "${label}" cho ${selectedConversation.name}`,
    });
  }}
/>

          {/* Snackbar */}
          <Snackbar
            open={toast.open}
            autoHideDuration={3000}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            message={toast.message}
            sx={{ marginTop: 9, zIndex: 3000 }}
          />
        </Box>
      )}

      {/* Mobile Sidebar Toggle */}

      {isMobile && (
        <>
          {/* Toggle button */}
          <IconButton
            onClick={(e) => {
              e.currentTarget.blur();
              setMobileOpen((prev) => !prev); // toggle instead of always true
            }}
            sx={{
              position: 'fixed',
              top: '0.2vh',
              left: '90vw',
              zIndex: 3000,
              bgcolor: '#448f2bff',
              color: 'white',
              '&:hover': { bgcolor: '#1a237e' },
            }}
          >
            <DehazeIcon />
          </IconButton>
          {/* Mobile sidebar dialog */}
          <Dialog
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            fullScreen={false} // bỏ fullScreen
            PaperProps={{
              sx: {
                bgcolor: '#4159c7',
                color: 'white',
                width: '90vw', // responsive width
                maxWidth: 460, // giới hạn max width
                position: 'absolute',
                top: mobileOpen ? '4vh' : '0', // top thay đổi khi mở/đóng
                left: mobileOpen ? '1vw' : '-100vw', // đẩy Dialog ra ngoài màn hình khi đóng
                borderRadius: 2,
                boxShadow: 6,
                transition: 'left 0.3s ease, top 0.3s ease', // animation mượt
              },
            }}
            disableEnforceFocus
            disableAutoFocus
          >
            {/* Menu */}
            <List sx={{ flexShrink: 0, px: 0, mt: 2, width: '90vw' }}>
              {menuItems.map((item) => (
                <Tooltip key={item.key} title={item.label} placement="right" arrow>
                  <ListItemButton
                    selected={activeSection === item.key}
                    onClick={() => {
                      setActiveSection(item.key);
                      setActiveModule(item.key);
                      setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      color: activeSection === item.key ? 'white' : 'rgba(255,255,255,0.7)',
                      bgcolor: activeSection === item.key ? 'primary.main' : 'transparent',
                      '&:hover': {
                        bgcolor:
                          activeSection === item.key ? 'primary.dark' : 'rgba(255,255,255,0.15)',
                      },
                      transition: 'all 0.3s ease',
                      justifyContent: 'flex-start',
                      mb: 0.5,
                      px: 2,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit', mr: 2 }}>
                      {item.icon}
                    </ListItemIcon>
                    <Typography fontWeight={600}>{item.label}</Typography>
                  </ListItemButton>
                </Tooltip>
              ))}
            </List>

            {/* Divider */}
            {mobileOpen && activeSection === 'chat' && (
              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, my: 1.5, width: '90vw' }}>
                <Box
                  sx={{
                    flex: 1,
                    height: 1.5,
                    borderRadius: 1,
                    background: 'linear-gradient(90deg, #6a11cb, #2575fc)',
                    width: '40vw',
                  }}
                />
                <Typography
                  sx={{
                    mx: 1.5,
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  variant="caption"
                >
                  Cuộc hội thoại gần đây
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 1.5,
                    borderRadius: 1,
                    background: 'linear-gradient(90deg, #6a11cb, #2575fc)',
                    width: '40vw',
                  }}
                />
              </Box>
            )}
     {/* SearchBar */}
   <div style={{ padding: 20, maxWidth: 400 }}>
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        onSearch={(val) => console.log("Search:", val)}
        placeholder="Tìm kiếm bạn bè, tin nhắn..."
        rightIcon={<Mic fontSize="small" />}
        bgcolor="#f1f3f4"
        radius={30}
      />
    </div>
            {/* Conversations */}
            {mobileOpen && activeSection === 'chat' && (
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  mt: 0.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onScroll={handleScroll}
              >
                {loading &&
                  page === 1 &&
                  Array.from(new Array(6)).map((_, idx) => (
                    <ListItemButton key={idx} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
                      <Skeleton variant="circular" width={36} height={36} sx={{ mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="60%" height={20} />
                        <Skeleton width="80%" height={16} sx={{ mt: 0.5 }} />
                      </Box>
                    </ListItemButton>
                  ))}

                {conversations.length === 0 && !loading && (
                  <Typography color="grey.400" sx={{ p: 2 }}>
                    Không có hội thoại
                  </Typography>
                )}

                {conversations.map((c) => (
                  <ListItemButton
                    key={c.userId}
                    selected={activeUser === c.userId}
                    onClick={() => handleSelectUser(c)}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      my: 0.5,
                      p: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.main' },
                      },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                  >
                    {/* Avatar + Text */}
                    <Box display="flex" alignItems="center" flex="1" minWidth={0}>
                      <Box sx={{ position: 'relative', mr: 2 }}>
                        <Avatar src={c.avatarUrl ?? ''} sx={{ width: 40, height: 40 }} />

                        {c.isOnline && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              width: 10,
                              height: 10,
                              bgcolor: '#4caf50',
                              borderRadius: '50%',
                              border: '2px solid white',
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          noWrap
                          sx={{ fontWeight: c.unreadCount ? 700 : 600, color: 'inherit' }}
                        >
                          {c.name || c.userId}
                        </Typography>
                        <Typography
                          noWrap
                          variant="body2"
                          color={c.unreadCount ? 'white' : 'grey.400'}
                          sx={{ fontWeight: c.unreadCount ? 600 : 400 }}
                        >
                          {c.lastMessage || '...'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Badge */}
                    {c.unreadCount ? (
                      <Box
                        sx={{
                          ml: 1,
                          bgcolor: 'error.main',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          animation: c.hasNewMessage ? `${blink} 0.5s ease-in-out` : 'none',
                        }}
                      >
                        {c.unreadCount}
                      </Box>
                    ) : null}

                    {/* Admin Assign Button */}
                    {role === 'admin' && (
                      <Box sx={{ ml: 1, position: 'relative', flexShrink: 0 }}>
                        <ClickAwayListener
                          onClickAway={() =>
                            setConversations((prev) =>
                              prev.map((conv) => ({
                                ...conv,
                                isAssignMenuOpen: false,
                                showAssignSubmenu: false,
                              }))
                            )
                          }
                        >
                          {/* Nut ba cham */}
                          <Box>
                            <Button
                              size="small"
                              variant="text"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConversations((prev) =>
                                  prev.map((conv) => {
                                    if (conv.userId === c.userId) {
                                      const isOpen =
                                        conv.isAssignMenuOpen || conv.showAssignSubmenu;
                                      return {
                                        ...conv,
                                        isAssignMenuOpen: !isOpen && !conv.showAssignSubmenu,
                                        showAssignSubmenu: false,
                                      };
                                    }
                                    return {
                                      ...conv,
                                      isAssignMenuOpen: false,
                                      showAssignSubmenu: false,
                                    };
                                  })
                                );
                              }}
                              sx={{
                                minWidth: 32,
                                p: 0.5,
                                borderRadius: '50%',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </Button>

                            {c.isAssignMenuOpen && (
                              <Paper
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  position: 'absolute',
                                  top: '36px',
                                  right: 0,
                                  zIndex: 10,
                                  borderRadius: 2,
                                  boxShadow: 6,
                                  overflow: 'hidden',
                                }}
                              >
                                <MenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConversations((prev) =>
                                      prev.map((conv) =>
                                        conv.userId === c.userId
                                          ? {
                                              ...conv,
                                              showAssignSubmenu: true,
                                              isAssignMenuOpen: false,
                                            }
                                          : {
                                              ...conv,
                                              showAssignSubmenu: false,
                                              isAssignMenuOpen: false,
                                            }
                                      )
                                    );
                                  }}
                                >
                                  Phân công
                                </MenuItem>
                                <MenuItem onClick={(e) => e.stopPropagation()}>Xóa</MenuItem>
                                <MenuItem
  onClick={(e) => {
    e.stopPropagation();
    setSelectedConversation(c);
    setIsLabelDialogOpen(true);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.userId === c.userId
          ? { ...conv, isAssignMenuOpen: false, showAssignSubmenu: false }
          : conv
      )
    );
  }}
>
  Gắn nhãn
</MenuItem>

                              </Paper>
                            )}

                            {c.showAssignSubmenu && telesales.length > 0 && (
                              <Paper
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  position: 'absolute',
                                  top: '36px',
                                  right: 0,
                                  zIndex: 11,
                                  borderRadius: 2,
                                  boxShadow: 6,
                                  maxHeight: 200,
                                  overflowY: 'auto',
                                }}
                              >
                                {telesales.map((t) => (
                                  <MenuItem
                                    key={t.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedConversation(c);
                                      setSelectedTelesale(t);
                                      setIsConfirmOpen(true);
                                      setConversations((prev) =>
                                        prev.map((conv) =>
                                          conv.userId === c.userId
                                            ? { ...conv, showAssignSubmenu: false }
                                            : conv
                                        )
                                      );
                                    }}
                                  >
                                    <Avatar src={t.avatar} sx={{ width: 24, height: 24, mr: 1 }} />
                                    {t.username}
                                  </MenuItem>
                                ))}
                              </Paper>
                            )}
                          </Box>
                        </ClickAwayListener>
                      </Box>
                    )}
                  </ListItemButton>
                ))}
              </Box>
            )}
            {/* Dialog confirm */}
            <Dialog
              open={isConfirmOpen}
              onClose={() => setIsConfirmOpen(false)}
              sx={{ zIndex: 2600 }}
            >
              <DialogTitle>Xác nhận phân công</DialogTitle>
              <DialogContent>
                <Typography>
                  Bạn có chắc muốn phân công cho <strong>{selectedTelesale?.username}</strong> cho{' '}
                  <strong>{selectedConversation?.name}</strong>?
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsConfirmOpen(false)}>Hủy</Button>
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (!selectedConversation || !selectedTelesale) return;
                    try {
                      await assignTelesale(selectedConversation.userId, selectedTelesale._id);
                      setConversations((prev) =>
                        prev.map((conv) =>
                          conv.userId === selectedConversation.userId
                            ? { ...conv, isAssignMenuOpen: false }
                            : conv
                        )
                      );
                      setToast({
                        open: true,
                        message: `✅ Đã phân công ${selectedTelesale.username} cho ${displayName}`,
                      });
                    } catch (err) {
                      console.error(err);
                      setToast({ open: true, message: '❌ Assign failed' });
                    } finally {
                      setIsConfirmOpen(false);
                    }
                  }}
                >
                  Xác nhận
                </Button>
              </DialogActions>
            </Dialog>
                {/* LabelDialog*/}
<LabelDialog
  open={isLabelDialogOpen}
  onClose={() => setIsLabelDialogOpen(false)}
  selectedConversation={selectedConversation || undefined}
  availableLabels={availableLabels}
  setAvailableLabels={setAvailableLabels}
  onSave={(label) => {
    if (!selectedConversation) return;
    setConversations((prev) =>
      prev.map((conv) =>
        conv.userId === selectedConversation.userId
          ? { ...conv, label }
          : conv
      )
    );
    setToast({
      open: true,
      message: `✅ Đã gắn nhãn "${label}" cho ${selectedConversation.name}`,
    });
  }}
/>

            {/* Snackbar */}
            <Snackbar
              open={toast.open}
              autoHideDuration={3000}
              onClose={() => setToast((prev) => ({ ...prev, open: false }))}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              message={toast.message}
              sx={{ marginTop: 9, zIndex: 3000 }}
            />
          </Dialog>
        </>
      )}
    </>
  );
}
