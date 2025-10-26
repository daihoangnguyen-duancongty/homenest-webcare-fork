// test-socket.js
const io = require('socket.io-client');

// 1️⃣ Thay token của admin/telesale ở đây
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWRjNTJiOGQ4YTEzYmI5NTdkOGNmMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MDQxMzAxMCwiZXhwIjoxNzYxMDE3ODEwfQ.uUEXRJ4gPi0L3C8MRUVeEJzGiHF-pI1XFPrtl9WuGoI';
const USER_ID = '68edc52b8d8a13bb957d8cf3';

// Kết nối Socket.IO server
const socket = io('http://localhost:5000', {
  auth: { token: TOKEN },
});

socket.on('connect', () => {
  console.log('✅ Connected to server, socket id:', socket.id);

  // Join vào room của user (để nhận tin nhắn riêng)
  socket.emit('join', USER_ID);
  console.log(`🔹 Joined room: ${USER_ID}`);
});

// Nhận tin nhắn mới realtime
socket.on('new_message', (msg) => {
  console.log('💬 New message:', msg);
});

// Nhận tin nhắn được assign
socket.on('assigned_message', (msg) => {
  console.log('📝 Assigned message:', msg);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});
