/***
 * Modèle pour calculer les moyennes des réponses des team-member
 */

export interface SessionResultParticipant {
  userId: number;
  values: string[];
}

export interface SessionResult {
  id: number;
  idSession: number;
  userId: number;
  firstName: string;
  lastName: string;
  values: number[];
}