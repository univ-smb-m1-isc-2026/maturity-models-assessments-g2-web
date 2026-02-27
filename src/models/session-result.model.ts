/***
 * Modèle pour calculer les moyennes des réponses des team-member
 */

export interface SessionResult {
  sessionId: string;
  averages: number[];
  participants: {
    userId: number;
    values: number[];
  }[];
}