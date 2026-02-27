export interface Team {
  id: number;
  name: string;
  leadId: number; // id du user avec le role team-lead
  memberIds: string[]; // id des user avec le role team-membre
  createdAt: Date;
}