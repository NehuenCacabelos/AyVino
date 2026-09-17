export type AuthMode = 'login' | 'register';

export interface AuthFormData {
  name?: string;
  email: string;
  password: string;
}

