export interface User {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
  createdAt?: string;
}

// Usuario admin inicial
const ADMIN_EMAIL = 'info@custimizeitca.com';
const ADMIN_PASSWORD = 'CustomizeIt2024!Admin'; // Password para admin
const ADMIN_NAME = 'Administrador';

// Obtener usuarios desde localStorage
const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const usersStr = localStorage.getItem('users');
  if (usersStr) {
    return JSON.parse(usersStr);
  }
  
  // Inicializar con admin si no hay usuarios
  const initialUsers: User[] = [
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem('users', JSON.stringify(initialUsers));
  return initialUsers;
};

// Guardar usuarios en localStorage
const saveUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('users', JSON.stringify(users));
};

export const login = (email: string, password: string): User | null => {
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  return user || null;
};

// Registrar nuevo usuario o actualizar password
export const register = (email: string, password: string, name: string): { success: boolean; message: string; user?: User } => {
  const users = getStoredUsers();
  const emailLower = email.toLowerCase();
  
  // Verificar si el email es el permitido
  if (emailLower !== ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: 'Email no autorizado. Solo se permite info@custimizeitca.com' };
  }
  
  const existingUser = users.find(u => u.email.toLowerCase() === emailLower);
  
  if (existingUser) {
    // Si existe pero no tiene password, actualizar password
    if (!existingUser.password || existingUser.password === '') {
      existingUser.password = password;
      existingUser.name = name || existingUser.name;
      saveUsers(users);
      return { success: true, message: 'Contraseña creada exitosamente', user: existingUser };
    } else {
      return { success: false, message: 'Este email ya tiene una contraseña. Usa "Iniciar Sesión" en su lugar.' };
    }
  } else {
    // Crear nuevo usuario
    const newUser: User = {
      email: emailLower,
      password,
      name: name || 'Usuario',
      role: emailLower === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true, message: 'Usuario creado exitosamente', user: newUser };
  }
};

// Verificar si un email necesita registro (existe pero sin password)
export const needsRegistration = (email: string): boolean => {
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return !user || !user.password || user.password === '';
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
