import { Question } from './question.model';

export type MaturityCategory =
  | 'SCRUM'
  | 'CYBERSECURITY'
  | 'QUALITY'
  | 'AGILE'
  | 'DEVOPS'
  | 'CUSTOM';

export interface MaturityModel {
  id:          number;
  title:       string;
  description?: string;
  category:    MaturityCategory;  // ✅ Catégorie du modèle
  icon:        string;            // ✅ Emoji représentant la catégorie
  questions:   Question[];        // ✅ Questions associées au modèle
  createdAt:   Date;
}

// ✅ Catégories disponibles avec leur label et icône
export const MATURITY_CATEGORIES: { value: MaturityCategory; label: string; icon: string }[] = [
  { value: 'SCRUM',         label: 'Scrum',          icon: '🔄' },
  { value: 'CYBERSECURITY', label: 'Cybersécurité',  icon: '🔒' },
  { value: 'QUALITY',       label: 'Qualité',        icon: '✅' },
  { value: 'AGILE',         label: 'Agile',          icon: '⚡' },
  { value: 'DEVOPS',        label: 'DevOps',         icon: '🛠️' },
  { value: 'CUSTOM',        label: 'Personnalisé',   icon: '🧩' },
];
