import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MaturityModel } from '@models/maturity-model.model';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class MaturityModelService {

  private readonly apiUrl =`${environment.apiUrl}/api/models`;

  constructor(private http: HttpClient) {}

  getModels(): Observable<MaturityModel[]> {
    return this.http.get<MaturityModel[]>(this.apiUrl);
  }

  getModelById(id: number): Observable<MaturityModel> {
    return this.http.get<MaturityModel>(`${this.apiUrl}/${id}`);
  }

  createModel(model: Omit<MaturityModel, 'id' | 'createdAt'>): Observable<MaturityModel> {
    return this.http.post<MaturityModel>(this.apiUrl, model);
  }

  updateModel(id: number, model: Partial<MaturityModel>): Observable<MaturityModel> {
    return this.http.put<MaturityModel>(`${this.apiUrl}/${id}`, model);
  }

  deleteModel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}