const NAMES = [
    "An", "Binh", "Cuong", "Dung", "Em", "Phuong",
    "Ha", "Khanh", "Lan", "Minh", "Nga", "Quyen", "Son", "Trang"
  ];
  
  const DEFAULT_AVATARS = [
    'https://i.ibb.co/2n1cP2r/default-avatar.png',
    'https://i.ibb.co/3c2dV7F/avatar1.png',
    'https://i.ibb.co/7kK8qT9/avatar2.png',
    'https://i.ibb.co/4m6yJdS/avatar3.png',
    'https://i.ibb.co/Fz2vB1k/avatar4.png'
  ];
  
  export function getRandomName(): string {
    const first = NAMES[Math.floor(Math.random() * NAMES.length)];
    const last = NAMES[Math.floor(Math.random() * NAMES.length)];
    return `${first} ${last}`;
  }
  
  export function getRandomAvatar(): string {
    return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  }
  
  export function createMockUser(userId: string) {
    return {
      _id: userId,
      username: getRandomName(),
      email: `${userId}@zalo.local`,
      avatar: getRandomAvatar()
    };
  }
  