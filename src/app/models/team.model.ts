export interface Team {
  id: number;
  name: string;
  leadId: number; // id du user avec le role team-lead
  memberIds: number[]; // id des user avec le role team-member
  createdAt?: Date;
}