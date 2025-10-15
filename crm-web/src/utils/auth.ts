export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login';
}
export const getToken = () => localStorage.getItem('token');
