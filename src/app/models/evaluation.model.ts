export interface Answer {
  questionId: number;
  value:      number;  // ✅ Note de 1 à 5
}

export interface Evaluation {
  id:          number;
  sessionId:   string;   // ✅ string pour matcher SessionResult
  modelId:     number;
  teamId:      number;
  userId:      number;
  answers:     Answer[];
  completedAt: Date;
}