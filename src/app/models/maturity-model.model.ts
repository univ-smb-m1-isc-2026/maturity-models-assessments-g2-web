import { Question } from './question.model';

export type MaturityCategory =
  | 'SCRUM'
  | 'CYBERSECURITY'
  | 'QUALITY'
  | 'AGILE'
  | 'DEVOPS'
  | 'CUSTOM';

export type MaturityLevel =
  | 'Initial'
  | 'Répétable'
  | 'Défini'
  | 'Géré'
  | 'Optimisé';

export interface MaturityModel {
  id:          number;
  title:       string;
  description?: string;
  category:    MaturityCategory;  // ✅ Catégorie du modèle
  icon:        string;            // ✅ Emoji représentant la catégorie
  levels:      MaturityLevel[];   // ✅ Niveaux de maturité
  questions:   Question[];        // ✅ Questions associées au modèle
  createdBy:   number;            // id d'un user PMO/admin
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

// ✅ Niveaux par défaut selon la catégorie
export const DEFAULT_LEVELS: Record<MaturityCategory, MaturityLevel[]> = {
  SCRUM:         ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
  CYBERSECURITY: ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
  QUALITY:       ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
  AGILE:         ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
  DEVOPS:        ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
  CUSTOM:        ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
};