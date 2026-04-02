/***
 * Modèle pour calculer les moyennes des réponses des team-member
 */

export interface SessionResultParticipant {
  userId: number;
  values: number[];
}

export interface SessionResult {
  sessionResultId: number;
  idSession: number;
  averages: number[];
  participants: SessionResultParticipant[];
}