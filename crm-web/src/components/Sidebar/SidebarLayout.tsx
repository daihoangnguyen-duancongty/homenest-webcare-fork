import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ContactsIcon from '@mui/icons-material/Contacts';
import type { Conversation, GuestUser } from '../../types';
import { fetchConversations } from '../../api/adminApi';
import { getTelesales, type Telesales } from '../../api/authApi';
import { getToken } from '../../utils/auth';
import { BASE_URL, updateGuestLabel } from '../../api/zaloApi';
import { useSocketStore } from '../../store/socketStore';
import type { UserOnlinePayload, NewMessagePayload } from '../../types/socket';
import type { Message } from '../../types/index';
import SidebarWeb from './SidebarWeb';
import SidebarMobile from './SidebarMobile';

export type ModuleKey = 'chat' | 'employee' | 'customer' | 'automation' | 'reports';

export interface SidebarLayoutProps {
  onSelectUser: (userId: string) => void;
  setActiveModule: (module: ModuleKey) => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  role?: 'admin' | 'telesale';
  mobileOpen?: boolean;
  setMobileOpen?: (val: boolean) => void;
}

export interface ConversationWithAssign extends Conversation {
  label?: string;
  isAssignMenuOpen?: boolean;
  showAssignSubmenu?: boolean;
  messages: Message[];
  unreadCount?: number;
  hasNewMessage?: boolean;
  avatarUrl?: string;
  isOnline?: boolean;
  lastInteraction?: string;
}

export default function SidebarLayout({
  onSelectUser,
  setActiveModule,
  isExpanded,
  setIsExpanded,
  role = 'telesale',
}: SidebarLayoutProps) {
  // dùng zutand quản lý socket
  const { socket, isConnected } = useSocketStore();
  //tim kiem
  const [query, setQuery] = useState('');
  //sort
  const [filter, setFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  //lable
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<string[]>([
    'Khách tiềm năng',
    'Đã mua',
    'Quan tâm',
  ]);

  //
  const [isSocketReady, setIsSocketReady] = useState(false);
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
  const [selectedLabel, setSelectedLabel] = useState<string>(selectedConversation?.label || '');

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
  // Kết nối socket sau khi đã có dữ liệu cơ bản
  useEffect(() => {
    if (!socket || !isConnected) return;
    setIsSocketReady(true);
    console.log('🟢 Socket ready, listening to realtime events...');
  }, [socket, isConnected]);
  // Load conversations khi đổi role
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadConversations(1);
  }, [role]);
  // Kết nối socket và lắng nghe sự kiện realtime -> nhan du kieu tu store zustand
  useEffect(() => {
    if (!isSocketReady) return;

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

    socket?.on('user_online', handleUserOnline);
    socket?.on('new_message', handleNewMessage);

    return () => {
      console.log('🔴 Sidebar unsubscribing from realtime events...');
      socket?.off('user_online', handleUserOnline);
      socket?.off('new_message', handleNewMessage);
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
      const token = getToken();
      const res = await fetch(`${BASE_URL}/messages/${c.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const msgs: Message[] = await res.json();
      const updatedMsgs = msgs.map((m) => ({ ...m, read: true }));

      setConversations((prev) =>
        prev.map((conv) => (conv.userId === c.userId ? { ...conv, messages: updatedMsgs } : conv))
      );
    } catch (err) {
      console.error('❌ Failed to fetch messages', err);
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
  // update label
  const handleUpdateGuestLabel = async (userId: string, label: string): Promise<void> => {
    try {
      // 1️⃣ Gọi API và đảm bảo type rõ ràng
      const updatedUser: GuestUser = await updateGuestLabel(userId, label);

      // 2️⃣ Cập nhật trong danh sách conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === updatedUser._id ? { ...conv, label: updatedUser.label } : conv
        )
      );

      // 3️⃣ Cập nhật selectedConversation nếu trùng
      if (selectedConversation?.userId === updatedUser._id) {
        setSelectedConversation((prev) => (prev ? { ...prev, label: updatedUser.label } : prev));
      }

      // 4️⃣ Cập nhật selectedLabel để UI LabelDialog hiển thị ngay nhãn mới
      setSelectedLabel(updatedUser.label || label);

      // 5️⃣ Đồng bộ availableLabels: nếu nhãn mới chưa có, thêm vào
      if (!availableLabels.includes(label)) {
        setAvailableLabels((prev) => [...prev, label]);
      }

      // 6️⃣ Thông báo Toast
      setToast({
        open: true,
        message: `✅ Đã gắn nhãn "${label}" cho ${updatedUser.username || 'khách hàng'}`,
      });
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật nhãn:', err);
      setToast({ open: true, message: '❌ Không thể cập nhật nhãn' });
    }
  };

  //sort
  const handleFilterChange = (value: string) => {
    console.log('Đang lọc theo:', value);
    setFilter(value);
  };

  const handleSortChange = (order: 'asc' | 'desc') => {
    console.log('Thay đổi sắp xếp:', order);
    setSortOrder(order);
  };

  const handleClear = () => {
    setFilter('');
    setSortOrder('asc');
  };
  //
  const allMenuItems: { key: ModuleKey; icon: ReactNode; label: string; roles: string[] }[] = [
    { key: 'chat', icon: <ChatIcon />, label: 'Quản lý trò chuyện', roles: ['admin', 'telesale'] },
    { key: 'employee', icon: <GroupIcon />, label: 'Quản lý nhân viên', roles: ['admin'] },
    { key: 'customer', icon: <ContactsIcon />, label: 'Quản lý khách hàng', roles: ['admin'] },
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
      {/* Web Sidebar */}
      {!isMobile && (
        <SidebarWeb
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setActiveModule={setActiveModule}
          conversations={conversations}
          onSelectUser={handleSelectUser}
          handleSelectUser={handleSelectUser}
          role={role}
          query={query}
          setQuery={setQuery}
          handleScroll={handleScroll}
          handleFilterChange={handleFilterChange}
          handleSortChange={handleSortChange}
          handleClear={handleClear}
          menuItems={menuItems}
          displayName={displayName}
          isLabelDialogOpen={isLabelDialogOpen}
          setIsLabelDialogOpen={setIsLabelDialogOpen}
          availableLabels={availableLabels}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          selectedLabel={selectedLabel}
          setSelectedLabel={setSelectedLabel}
          toast={toast}
          setToast={setToast}
          telesales={telesales}
          filter={filter}
          sortOrder={sortOrder}
          selectedTelesale={selectedTelesale}
          setSelectedTelesale={setSelectedTelesale}
          isConfirmOpen={isConfirmOpen}
          setIsConfirmOpen={setIsConfirmOpen}
          setAvailableLabels={setAvailableLabels}
          loading={loading}
          page={page}
          setConversations={setConversations}
          activeUser={activeUser}
          onUpdateLabel={handleUpdateGuestLabel}
        />
      )}
      {/* Mobile Sidebar Toggle */}
      {mobileOpen && activeSection === 'chat' && (
        <SidebarMobile
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setActiveModule={setActiveModule}
          setConversations={setConversations}
          conversations={conversations}
          onSelectUser={handleSelectUser}
          role={role}
          query={query}
          setQuery={setQuery}
          handleScroll={handleScroll}
          handleFilterChange={handleFilterChange}
          handleSortChange={handleSortChange}
          handleClear={handleClear}
          menuItems={menuItems}
          displayName={displayName}
          isLabelDialogOpen={isLabelDialogOpen}
          setIsLabelDialogOpen={setIsLabelDialogOpen}
          availableLabels={availableLabels}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          selectedLabel={selectedLabel}
          setSelectedLabel={setSelectedLabel}
          toast={toast}
          setToast={setToast}
          telesales={telesales}
          filter={filter}
          sortOrder={sortOrder}
          selectedTelesale={selectedTelesale}
          setSelectedTelesale={setSelectedTelesale}
          isConfirmOpen={isConfirmOpen}
          setIsConfirmOpen={setIsConfirmOpen}
          setAvailableLabels={setAvailableLabels}
          loading={loading}
          page={page}
          onUpdateLabel={handleUpdateGuestLabel}
        />
      )}
    </>
  );
}
