import { SessionStatus } from "./status.enum";


/***
 * Modèle de session créer pour une équipe
 */
export interface Session {
  id: string;
  modelId: number; //id du maturity-model
  teamId: number; //id de la team 
  name: string;
  status: SessionStatus;
  deadline?: Date;
  createdAt: Date;
}

