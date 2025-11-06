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
import { keyframes } from '@mui/system';
import { assignTelesale, deleteUserMessages } from '../../api/zaloApi';
import SearchBar from '../SearchBar';
import { Mic } from '@mui/icons-material';
import SortFilter from '../SortFilter';
import LabelDialog from '../LabelDialog';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import type { ConversationWithAssign, ModuleKey } from './SidebarLayout';
import type { Telesales } from '../../api/authApi';
import type { Dispatch, SetStateAction } from 'react';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

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

export interface SidebarWebProps {
  // props chính
  onSelectUser: (conversation: ConversationWithAssign) => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  role?: 'admin' | 'telesale';

  // state điều hướng
  activeSection: ModuleKey;
  setActiveSection: Dispatch<SetStateAction<ModuleKey>>;
  setActiveModule: (module: ModuleKey) => void;
  activeUser: string | null;
  handleSelectUser: (c: ConversationWithAssign) => void;
  // dữ liệu hội thoại
  conversations: ConversationWithAssign[];
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
  selectedTelesale: Telesales | null;
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
  setToast: React.Dispatch<React.SetStateAction<{ open: boolean; message: string }>>;
  telesales: Telesales[];
  setSelectedTelesale: (t: Telesales | null) => void;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (val: boolean) => void;
  setConversations: React.Dispatch<React.SetStateAction<ConversationWithAssign[]>>;

  mobileOpen?: boolean;
  setMobileOpen?: (val: boolean) => void;
  loading: boolean;
  page: number;
}

export default function SidebarWeb({
  // chính
  onSelectUser,
  isExpanded,
  setIsExpanded,
  role = 'telesale',

  // điều hướng
  activeSection,
  setActiveSection,
  setActiveModule,
  activeUser,
  handleSelectUser,
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
}: SidebarWebProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    conv: ConversationWithAssign | null;
  }>({
    open: false,
    conv: null,
  });

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isExpanded ? 280 : 60,

        // Gradient bạc-xanh hiện đại, phong cách CRM 2025
        bgcolor: 'transparent',
        backgroundImage: `linear-gradient(180deg, #1a6fb3 0%, #4fa5d8 50%, #162b86 100%)`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',

        // Text & icon màu neon trắng/cyan
        color: '#e0f7fa',

        // Animation mở rộng
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',

        overflow: 'hidden',
        boxShadow: '2px 0 15px rgba(0,0,0,0.25)', // shadow sâu, hiện đại
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',

        // Glow neon nhẹ cho cạnh sidebar
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4px',
          height: '100%',
          background: 'linear-gradient(to bottom, #00f0ff, #00bcd4, #0091ea)',
          boxShadow: '0 0 15px #00f0ff',
          borderRadius: '0 4px 4px 0',
        },

        // Hover glow cho sidebar khi chuột vào
        '&:hover': {
          boxShadow: '4px 0 25px rgba(0,255,255,0.3)',
        },
      }}
    >
      {/* Header + Toggle */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          bgcolor: 'transparent',
          backgroundImage: `linear-gradient(180deg, #c0d6e4 0%, #a0c4e8 50%, #e0f0ff 100%)`,
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)', // glow xanh nhẹ

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
                  bgcolor: activeSection === item.key ? 'primary.dark' : 'rgba(255,255,255,0.15)',
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
                          <MenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({ open: true, conv: c });
                            }}
                          >
                            Xóa
                          </MenuItem>

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
      )}

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
