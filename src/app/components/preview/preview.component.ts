import { Component, inject, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IframeScrollPostionService } from '../../services/iframe-scroll-postition-service';
import { ILayoutService } from '../../interfaces/layout-service';
import { LocalLayoutService } from '../../services/local-layout-service';

@Component({
  selector: 'app-preview',
  templateUrl: 'preview.component.html',
  styleUrl: 'preview.component.scss',
  providers: [
    IframeScrollPostionService,
    { provide: ILayoutService, useClass: LocalLayoutService },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Preview {
  readonly content = input('');

  protected renderedContent = computed<SafeHtml>(() => this.render(this.content()));

  private sanitizer = inject(DomSanitizer);
  private iframeScrollPostionService = inject(IframeScrollPostionService);

  private render(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      this.iframeScrollPostionService.addScriptToHtml(content),
    );
  }
}
