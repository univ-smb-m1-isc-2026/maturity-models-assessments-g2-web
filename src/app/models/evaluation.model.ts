export interface UserAnswer {
  questionId: number;
  value:      string;  
}

export interface Evaluation {
  id:          number;
  sessionId:   number;   
  modelId:     number;
  teamId:      number;
  userId:      number;
  answers:     UserAnswer[];
  completedAt: Date;
}