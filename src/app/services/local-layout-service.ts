import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ILayoutService } from '../interfaces/layout-service';
import { Layout } from '../models/layout';

@Injectable()
export class LocalLayoutService extends ILayoutService {
  private baseUrl: string;
  private layouts: Layout[] = [
    { id: 1, name: 'Document', content: '' },
    { id: 2, name: 'Document with page numbers', content: '' },
    { id: 3, name: 'Document with table of contents', content: '' },
    { id: 4, name: 'Email', content: '' },
  ];

  constructor() {
    super();
    const httpClient = inject(HttpClient);
    this.baseUrl = `${document.baseURI}assets/layouts/`;
    this.loadContent(httpClient, 1, 'a4');
    this.loadContent(httpClient, 2, 'pagedjs');
    this.loadContent(httpClient, 3, 'pagedjs-toc');
    this.loadContent(httpClient, 4, 'email');
  }

  public getAll(): Observable<Layout[]> {
    return of(this.layouts);
  }

  public get(id: number): Observable<Layout> {
    return of(this.layouts.find((i) => i.id == id) ?? { id: id, name: '', content: '' });
  }

  private loadContent(httpClient: HttpClient, id: number, file: string) {
    httpClient
      .get(`${this.baseUrl}${file}.html`, { responseType: 'text' })
      .subscribe((content) => (this.layouts.find((i) => i.id === id)!.content = content));
  }
}
