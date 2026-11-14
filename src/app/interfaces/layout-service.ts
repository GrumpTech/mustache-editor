import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Layout } from '../models/layout';

@Injectable()
export abstract class ILayoutService {
  public abstract getAll(): Observable<Layout[]>;
  public abstract get(id: number): Observable<Layout>;
}
