import { Injectable } from '@angular/core';
import * as Mustache from 'mustache';

@Injectable({ providedIn: 'root' })
export class TemplateReader {
  getTestData(template: string, partials?: Record<string, string>): any {
    const parsedPartials: Record<string, any> = {};
    if (partials) {
      for (const key in partials) {
        parsedPartials[key] = Mustache.parse(partials[key]);
      }
    }
    return this.getTestDataRecursive(Mustache.parse(template), parsedPartials, new Set<string>());
  }

  getPartialNames(template: string): Set<string> {
    const names = this.getPartialNamesRecursive(Mustache.parse(template));
    return new Set(names);
  }

  private getTestDataRecursive(
    parsed: any,
    parsedPartials: Record<string, any>,
    visited: Set<string>,
  ): any {
    const result: any = {};
    parsed.forEach((i: any) => {
      if (i[0] === 'name' || i[0] === '&') {
        result[i[1]] = '';
      } else if (i[0] === '#' && i[1] !== '') {
        result[i[1]] = this.getTestDataRecursive(i[4], parsedPartials, visited);
      } else if (i[0] === '>') {
        if (parsedPartials[i[1]] && !visited.has(i[1])) {
          Object.assign(
            result,
            this.getTestDataRecursive(
              parsedPartials[i[1]],
              parsedPartials,
              new Set<string>(visited).add(i[1]),
            ),
          );
        }
      }
    });
    return result;
  }

  private getPartialNamesRecursive(parsed: any): string[] {
    const result: string[] = [];
    parsed.forEach((i: any) => {
      if (i[0] === '>') {
        result.push(i[1]);
      } else if (i[0] === '#' || i[0] === '^') {
        this.getPartialNamesRecursive(i[4]).forEach((i) => result.push(i));
      }
    });
    return result;
  }
}
