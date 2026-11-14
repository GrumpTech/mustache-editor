import { Injectable, OnDestroy } from '@angular/core';

@Injectable()
export class IframeScrollPostionService implements OnDestroy {
  private left = 0;
  private top = 0;
  private messageHandler = (event: MessageEvent) => {
    this.handleMessageReceived(event);
  };

  constructor() {
    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageHandler);
  }

  addScriptToHtml(content: string): string {
    const script = this.createScript();
    const pos = content.toLocaleLowerCase().lastIndexOf('</body>');
    return pos === -1
      ? content + script
      : content.substring(0, pos) + script + content.substring(pos);
  }

  createScript(): string {
    return (
      '<script>' +
      '(' +
      this.initializeIframe.toString().replace('initializeIframe', 'function') +
      `)('${window.location.protocol + window.location.host}', ${this.left}, ${this.top});` +
      '</script>'
    );
  }

  private handleMessageReceived(event: MessageEvent): void {
    this.left = event.data.left;
    this.top = event.data.top;
  }

  private initializeIframe(host: string, left: number, top: number): void {
    const html = document.querySelector('html')!;
    const resizeObserver = new ResizeObserver(() => {
      window.scrollTo(left, top);
    });
    resizeObserver.observe(html);
    window.addEventListener('scroll', function () {
      this.window.parent.postMessage({ left: this.window.scrollX, top: this.window.scrollY }, host);
    });
  }
}
