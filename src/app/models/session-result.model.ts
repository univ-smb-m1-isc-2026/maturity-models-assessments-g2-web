/***
 * Modèle pour calculer les moyennes des réponses des team-member
 */

export interface SessionResult {
  sessionResultId: number;
  sessionId: number;
  averages: number[];
  participants: {
    userId: number;
    values: number[];
  }[];
}
