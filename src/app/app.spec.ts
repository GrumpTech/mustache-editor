import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideLocalStorageExplorer } from '@grumptech/ngx-matx/explorer';

describe('App', () => {
  window.ResizeObserver = class ResizeObserver {
    observe() {
      /* empty */
    }
    unobserve() {
      /* empty */
    }
    disconnect() {
      /* empty */
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideLocalStorageExplorer('GrumpTech-mustache-designer_')],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render editor', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-designer')).toBeTruthy();
  });
});
