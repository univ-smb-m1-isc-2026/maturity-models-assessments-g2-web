import { Role } from './role.enum';

export enum Status {
  ATTENTE = "En attente",
  ACTIF = "Actif"
}

export interface User {
  id: number;
  email: string; 
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  teamId?: number; // à voir gestion des id user dans team.model 
  status : Status
  createdAt?: Date;
}