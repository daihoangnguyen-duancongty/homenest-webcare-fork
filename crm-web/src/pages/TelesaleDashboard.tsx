import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './../components/sidebar/Sidebar';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import { getCurrentUser } from '../utils/auth';

export default function TelesaleDashboard() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<'chat' | 'employee' | 'automation' | 'reports'>('chat');

  const [isExpanded, setIsExpanded] = useState(false);

  const user = getCurrentUser();
  const role = user?.role || 'telesale';

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'linear-gradient(180deg, #2979ca 0%, #edf2f7 100%)' }}>
      <Sidebar onSelectUser={setSelectedUser} setActiveModule={setActiveModule} isExpanded={isExpanded} setIsExpanded={setIsExpanded} role={role} />
      <Header isExpanded={isExpanded} activeSection={activeModule} />
      <Box sx={{ flex: 1, marginLeft: isExpanded ? '280px' : '60px', marginTop: '10vh', p: 3, transition: 'margin-left 0.3s ease', overflow: 'auto' }}>
        {activeModule === 'chat' && selectedUser && <ChatPanel userId={selectedUser} role={role} />}
      </Box>
    </Box>
  );
}
