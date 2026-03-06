import { Role } from './role.enum';

export interface User {
  id: number;
  email: string; 
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  teamId?: number; // un user peut être dans plusieur team ? 
  createdAt?: Date;
}