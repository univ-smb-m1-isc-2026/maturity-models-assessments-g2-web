/***
 * Modèle pour calculer les moyennes des réponses des team-member
 */

// session-result.model.ts
export interface SessionResultParticipant {
  userId: number;
  values: number[];
}

export interface SessionResult {
  sessionResultId: number;
  sessionId: number;
  averages: number[];
  participants: SessionResultParticipant[];
}