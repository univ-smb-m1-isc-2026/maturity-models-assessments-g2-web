import { Answer } from "./answer.model";

export interface Question {
  id:    number;
  text:  string;
  questionOrder: number;
  answers : Answer[];
}