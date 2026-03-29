import { Answer } from "./evaluation.model";

export interface Question {
  id:    number;
  text:  string;
  questionOrder: number;
  answers : Answer[];
}