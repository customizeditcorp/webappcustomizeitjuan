export interface User {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
  createdAt?: string;
  isTemporaryPassword?: boolean; // Indica si la contraseña es temporal y debe cambiarse
}

// Usuarios iniciales con contraseñas temporales
const ADMIN_EMAIL = 'customizeditcorp@gmail.com';
const ADMIN_TEMP_PASSWORD = 'AdminTemp2024!'; // Contraseña provisional para admin
const ADMIN_NAME = 'Administrador';

const USER_EMAIL = 'info@customizeitca.com';
const USER_TEMP_PASSWORD = 'UserTemp2024!'; // Contraseña temporal para usuario
const USER_NAME = 'Usuario';

// Obtener usuarios desde localStorage
const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const usersStr = localStorage.getItem('users');
  if (usersStr) {
    return JSON.parse(usersStr);
  }
  
  // Inicializar con usuarios si no hay usuarios guardados
  const initialUsers: User[] = [
    {
      email: ADMIN_EMAIL,
      password: ADMIN_TEMP_PASSWORD,
      name: ADMIN_NAME,
      role: 'admin',
      isTemporaryPassword: true, // Marcar como temporal
      createdAt: new Date().toISOString()
    },
    {
      email: USER_EMAIL,
      password: USER_TEMP_PASSWORD,
      name: USER_NAME,
      role: 'user',
      isTemporaryPassword: true, // Marcar como temporal
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

// Cambiar contraseña (de temporal a permanente)
export const changePassword = (email: string, oldPassword: string, newPassword: string): { success: boolean; message: string; user?: User } => {
  const users = getStoredUsers();
  const emailLower = email.toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === emailLower);
  
  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }
  
  if (user.password !== oldPassword) {
    return { success: false, message: 'Contraseña actual incorrecta' };
  }
  
  if (oldPassword === newPassword) {
    return { success: false, message: 'La nueva contraseña debe ser diferente a la actual' };
  }
  
  // Actualizar contraseña y remover flag de temporal
  user.password = newPassword;
  user.isTemporaryPassword = false;
  saveUsers(users);
  
  return { success: true, message: 'Contraseña actualizada exitosamente', user };
};

// Registrar nuevo usuario o actualizar password
export const register = (email: string, password: string, name: string): { success: boolean; message: string; user?: User } => {
  const users = getStoredUsers();
  const emailLower = email.toLowerCase();
  
  // Verificar si el email está permitido
  const allowedEmails = [ADMIN_EMAIL.toLowerCase(), USER_EMAIL.toLowerCase()];
  if (!allowedEmails.includes(emailLower)) {
    return { success: false, message: 'Email no autorizado. Solo se permiten emails predefinidos.' };
  }
  
  const existingUser = users.find(u => u.email.toLowerCase() === emailLower);
  
  if (existingUser) {
    // Si existe pero no tiene password, actualizar password
    if (!existingUser.password || existingUser.password === '') {
      existingUser.password = password;
      existingUser.name = name || existingUser.name;
      existingUser.isTemporaryPassword = false;
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
      isTemporaryPassword: false,
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
