export interface Question {
  id: number;
  label: string;
  description?: string; //optionnel 
  modelId: number; // une question peut être dans plusieurs model ?
}