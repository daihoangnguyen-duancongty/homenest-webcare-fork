import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
  Avatar,
  Tooltip,
  ListSubheader,
  ListItemIcon,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import AssessmentIcon from '@mui/icons-material/Assessment';
import type { Conversation } from '../types';
import { fetchConversations } from '../api/adminApi';

export type ModuleKey = 'chat' | 'customers' | 'automation' | 'reports';

interface SidebarProps {
  onSelectUser: (userId: string) => void;
  setActiveModule: (module: ModuleKey) => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  role?: 'admin' | 'telesale';
}

export default function Sidebar({
  onSelectUser,
  setActiveModule,
  isExpanded,
  setIsExpanded,
  role = 'telesale',
}: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ModuleKey>('chat');

  // Load danh sách hội thoại
  const loadConversations = async () => {
    try {
      const data = await fetchConversations();
      if (role === 'telesale') {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        setConversations(data.filter((c) => c.assignedTelesale === user.id));
      } else {
        setConversations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [role]);

  // Menu dựa trên role
  const allMenuItems: { key: ModuleKey; icon: ReactNode; label: string; roles: string[] }[] = [
    { key: 'chat', icon: <ChatIcon />, label: 'Chat', roles: ['admin', 'telesale'] },
    { key: 'customers', icon: <GroupIcon />, label: 'Quản lý KH', roles: ['admin'] },
    { key: 'automation', icon: <AutoModeIcon />, label: 'Automation', roles: ['admin'] },
    { key: 'reports', icon: <AssessmentIcon />, label: 'Báo cáo', roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  return (
    <Box
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
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
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 2,
          fontWeight: 700,
          textAlign: 'center',
          pl: isExpanded ? 0 : 1.5,
          background: 'linear-gradient(90deg, #eef7f3, #cfd1d6)',
          letterSpacing: 0.5,
          fontSize: isExpanded ? '1rem' : '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60px',
        }}
      >
        {isExpanded ? (
          'HOMENEST CRM'
        ) : (
          <img
            src="https://homenest.com.vn/wp-content/uploads/2024/12/logo-HN-final-07-1.png"
            alt="Logo"
            style={{ width: 48, height: 48 }}
          />
        )}
      </Box>

      {/* Menu chính */}
      <List sx={{ flexShrink: 0, px: 0, mt: 2 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.key} title={!isExpanded ? item.label : ''} placement="right" arrow>
            <ListItemButton
              selected={activeSection === item.key}
              onClick={() => {
                setActiveSection(item.key);
                setActiveModule(item.key);
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
              {isExpanded && (
                <ListItemText
                  primary={
                    <Typography fontWeight={600} color="inherit">
                      {item.label}
                    </Typography>
                  }
                />
              )}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>

      {/* Danh sách hội thoại */}
      {isExpanded && activeSection === 'chat' && (
        <>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mt: 1 }} />
          <List
            subheader={
              <ListSubheader sx={{ bgcolor: 'transparent', color: 'grey.400', fontWeight: 600 }}>
                💬 Hội thoại gần đây
              </ListSubheader>
            }
            sx={{ flex: 1, overflowY: 'auto', mt: 0.5 }}
          >
            {conversations.map((c) => (
              <ListItemButton
                key={c.userId}
                selected={activeUser === c.userId}
                onClick={() => {
                  setActiveUser(c.userId);
                  onSelectUser(c.userId);
                }}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.main' },
                  },
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.3s ease',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    width: 36,
                    height: 36,
                  }}
                >
                  {c.name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <ListItemText
                  primary={c.name || c.userId}
                  secondary={
                    <Typography variant="body2" color="grey.400" noWrap>
                      {c.lastMessage || '...'}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </Box>
  );
}
