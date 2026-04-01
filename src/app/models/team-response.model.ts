import { User } from "./user.model";

export interface TeamResponse {
  id: number;
  name: string;
  lead: User;
  members: User[];
  createdAt: string;
}