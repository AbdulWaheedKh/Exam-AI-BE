export interface User {
  id?: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
} 