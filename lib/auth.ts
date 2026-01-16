export interface User {
  username: string;
  password: string;
  name: string;
}

// Hardcoded users (en producción, esto debería estar en una base de datos)
export const USERS: User[] = [
  { username: 'admin', password: 'admin123', name: 'Administrador' },
  { username: 'ecuador', password: 'ecuador123', name: 'Equipo Ecuador' },
];

export const login = (username: string, password: string): User | null => {
  const user = USERS.find(u => u.username === username && u.password === password);
  return user || null;
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

export const logout = (): void => {
  setCurrentUser(null);
};
