import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MaturityModel } from '@models/maturity-model.model';

@Injectable({ providedIn: 'root' })
export class MaturityModelService {

  private models: MaturityModel[] = [
    {
      id: 1,
      title: 'Scrum Avancé',
      description: 'Modèle basé sur les pratiques Scrum',
      category: 'SCRUM',
      icon: '🔄',
      levels: ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
      createdBy: 1,
      createdAt: new Date(),
      questions: [
        { id: 1, text: 'Les sprints sont-ils bien définis ?',        order: 1 },
        { id: 2, text: 'Les rétrospectives sont-elles régulières ?', order: 2 },
        { id: 3, text: 'Le backlog est-il priorisé ?',               order: 3 },
      ]
    },
    {
      id: 2,
      title: 'Cybersécurité NIST',
      description: 'Modèle basé sur le framework NIST',
      category: 'CYBERSECURITY',
      icon: '🔒',
      levels: ['Initial', 'Répétable', 'Défini', 'Géré', 'Optimisé'],
      createdBy: 1,
      createdAt: new Date(),
      questions: [
        { id: 1, text: 'Les accès sont-ils contrôlés ?',            order: 1 },
        { id: 2, text: 'Les incidents sont-ils tracés ?',           order: 2 },
        { id: 3, text: 'Les données sensibles sont-elles chiffrées ?', order: 3 },
      ]
    }
  ];

  getModels(): Observable<MaturityModel[]> {
    return of(this.models);
  }

  getModelById(id: number): Observable<MaturityModel> {
    return of(this.models.find(m => m.id === id)!);
  }

  createModel(model: Omit<MaturityModel, 'id' | 'createdAt'>): Observable<MaturityModel> {
    const newModel: MaturityModel = {
      ...model,
      id:        Date.now(),
      createdAt: new Date()
    };
    this.models.push(newModel);
    return of(newModel);
  }

  updateModel(id: number, model: Partial<MaturityModel>): Observable<MaturityModel> {
    const index = this.models.findIndex(m => m.id === id);
    this.models[index] = { ...this.models[index], ...model };
    return of(this.models[index]);
  }

  deleteModel(id: number): Observable<void> {
    this.models = this.models.filter(m => m.id !== id);
    return of(void 0);
  }
}