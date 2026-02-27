import { Question } from './question.model';
import {User} from './user.model'

/***
 * Model réutilisable de question 
 * Ne s'associe pas à des réponses ou à des équipes
 */

export interface MaturityModel {
  id: number;
  title: string;
  description?: string; //optionnel
  questions: Question[]; // taille libre, peut-être fixée à 5 mais moins modulable en cas de changement 
  createdBy: number; // id d'un user PMO/admin
  createdAt: Date;
}