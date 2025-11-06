import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
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
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DehazeIcon from '@mui/icons-material/Dehaze';
import { keyframes } from '@mui/system';
import type { Conversation } from '../../types';
import { assignTelesale } from '../../api/zaloApi';
import type { Message } from '../../types/index';
import SearchBar from '../SearchBar';
import { Mic } from '@mui/icons-material';
import SortFilter from '../SortFilter';
import LabelDialog from '../LabelDialog';
import { type Telesales } from '../../api/authApi';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

export type ModuleKey = 'chat' | 'employee' | 'customer' | 'automation' | 'reports';

export interface SidebarMobileProps {
  // props chính
  onSelectUser: (conversation: ConversationWithAssign) => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  role?: 'admin' | 'telesale';

  // state điều hướng
  activeSection: ModuleKey;
  setActiveSection: Dispatch<SetStateAction<ModuleKey>>;
  setActiveModule: (module: ModuleKey) => void;

  // dữ liệu hội thoại
  conversations: ConversationWithAssign[];
  setConversations: Dispatch<SetStateAction<ConversationWithAssign[]>>; // ✅ thêm dòng này
  query: string;
  setQuery: (val: string) => void;

  // sắp xếp, lọc
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  handleFilterChange: (value: string) => void;
  handleSortChange: (order: 'asc' | 'desc') => void;
  handleClear: () => void;
  filter: string;
  sortOrder: 'asc' | 'desc';

  // menu và hiển thị
  menuItems: { key: ModuleKey; icon: React.ReactNode; label: string; roles: string[] }[];
  displayName?: string;

  // quản lý nhãn & telesale
  isLabelDialogOpen: boolean;
  setIsLabelDialogOpen: (val: boolean) => void;
  availableLabels: string[];
  setAvailableLabels: Dispatch<SetStateAction<string[]>>;
  selectedConversation: ConversationWithAssign | null;
  setSelectedConversation: (conv: ConversationWithAssign | null) => void;
  selectedLabel: string;
  setSelectedLabel: (val: string) => void;
  onUpdateLabel: (userId: string, label: string) => Promise<void>;
  // Toast và xác nhận
  toast: { open: boolean; message: string };
  setToast: Dispatch<SetStateAction<{ open: boolean; message: string }>>; // ✅

  telesales: Telesales[];

  // ⚙️ Thêm dòng này:
  selectedTelesale: Telesales | null;

  setSelectedTelesale: (t: Telesales | null) => void;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (val: boolean) => void;

  // Mobile
  mobileOpen?: boolean;
  setMobileOpen?: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  page: number;
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

const blink = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
`;

export default function SidebarMobile({
  // chính
  onSelectUser,
  isExpanded,
  setIsExpanded,
  role = 'telesale',

  // điều hướng
  activeSection,
  setActiveSection,
  setActiveModule,

  // hội thoại
  conversations,
  query,
  setQuery,
  setConversations,
  // sắp xếp, lọc
  handleScroll,
  handleFilterChange,
  handleSortChange,
  handleClear,
  filter,
  sortOrder,

  // menu & hiển thị
  menuItems,
  displayName,

  // nhãn & telesale
  isLabelDialogOpen,
  setIsLabelDialogOpen,
  availableLabels,
  setAvailableLabels,
  selectedConversation,
  setSelectedConversation,
  selectedLabel,
  setSelectedLabel,
  onUpdateLabel,
  // thông báo & xác nhận
  toast,
  setToast,
  telesales,
  selectedTelesale,
  setSelectedTelesale,
  isConfirmOpen,
  setIsConfirmOpen,

  // mobile
  mobileOpen = false,
  setMobileOpen = (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  loading,
  page,
}: SidebarMobileProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    conv: ConversationWithAssign | null;
  }>({
    open: false,
    conv: null,
  });

  return (
    <Box>
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
            bgcolor: 'transparent',
            backgroundImage: `linear-gradient(180deg, #1a6fb3 0%, #4fa5d8 50%, #162b86 100%)`,
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
                    bgcolor: activeSection === item.key ? 'primary.dark' : 'rgba(255,255,255,0.15)',
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

        {/* SearchBar */}
        <div style={{ padding: 20, maxWidth: 400 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            onSearch={(val) => console.log('Search:', val)}
            placeholder="Tìm kiếm bạn bè, tin nhắn..."
            rightIcon={<Mic fontSize="small" />}
            bgcolor="#f1f3f4"
            radius={30}
          />
        </div>
        {/* SortFilter */}
        <SortFilter
          filters={[
            { label: 'Tên người dùng', value: 'username' },
            { label: 'Nhãn', value: 'label' },
            { label: 'Ngày tham gia', value: 'joined' },
          ]}
          selectedFilter={filter}
          sortOrder={sortOrder}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onClear={handleClear}
          sx={{ maxWidth: 400 }}
        />
        {/* Conversations */}

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
              selected={selectedConversation?.userId === c.userId}
              onClick={() => onSelectUser(c)}
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
                                    ? {
                                        ...conv,
                                        isAssignMenuOpen: false,
                                        showAssignSubmenu: false,
                                      }
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

        {/* Dialog confirm */}
        <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} sx={{ zIndex: 2600 }}>
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
        {/* LabelDialog */}
        <LabelDialog
          open={isLabelDialogOpen}
          onClose={() => setIsLabelDialogOpen(false)}
          selectedConversation={selectedConversation || undefined}
          availableLabels={availableLabels}
          selectedLabel={selectedLabel}
          setSelectedLabel={setSelectedLabel}
          setAvailableLabels={setAvailableLabels}
          onSave={async (label) => {
            if (!selectedConversation) return;
            await onUpdateLabel(selectedConversation.userId, label);
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
      {/* DeleteConfirmDialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        conv={deleteDialog.conv}
        onClose={() => setDeleteDialog({ open: false, conv: null })}
        setToast={setToast}
        setConversations={setConversations}
      />
    </Box>
  );
}
