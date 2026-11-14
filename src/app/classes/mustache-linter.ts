import { EditorView } from 'codemirror';
import { linter, Diagnostic } from '@codemirror/lint';
import { Extension } from '@codemirror/state';
import { SyntaxNodeRef } from '@lezer/common';
import { parser as htmlParser } from '@lezer/html';
import { parser as mustacheParser } from '@grumptech/lezer-mustache';
import { environment } from '../../environments/environment';
import { mustacheLinterDefaults, MustcheLinterSettings } from './mustache-linter-defaults';

export class MustacheLinterFactory {
  private splittableHtmlNodes: Record<string, boolean> = {
    Document: true,
    Element: true,
    Text: true,
  };

  constructor(private settings: MustcheLinterSettings = mustacheLinterDefaults) {}

  create(): Extension {
    return linter((view: EditorView) => this.lint(view), {
      delay: 500,
    });
  }

  // TODO:
  // - CSS
  // - sections should contain complete document fragments
  lint(view: EditorView): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const content = view.state.doc.toString();
    const tree = mustacheParser.parse(content);

    const htmlParts: string[] = [];
    const mustacheElements: { from: number; to: number }[] = [];
    let htmlLength = 0;
    const positions = [{ pos: 0, htmlPos: 0 }];
    tree.cursor().iterate((node) => {
      if (node.name === 'Content') {
        htmlParts.push(content.substring(node.from, node.to));
        positions.push({ pos: node.from, htmlPos: htmlLength });
        htmlLength += node.to - node.from;
      } else {
        if (node.name === 'Element') {
          mustacheElements.push({ from: node.from, to: node.to });
        }
        const diagnostic = this.validateMustache(node);
        if (diagnostic) {
          diagnostics.push(diagnostic);
        }
      }
      return true;
    });

    const html = htmlParts.join('');
    const htmlTree = htmlParser.parse(html);
    let posIdx = 0;
    htmlTree.cursor().iterate((node) => {
      for (
        const l = positions.length;
        posIdx + 1 < l && node.from >= positions[posIdx + 1].htmlPos;
        posIdx++
      );
      if (
        posIdx + 1 < positions.length &&
        node.to > positions[posIdx + 1].htmlPos &&
        !this.splittableHtmlNodes[node.name]
      ) {
        // add diagnostics for incomplete nodes
        return false;
      }
      const diagnostic = this.validateHtml(html, node);
      if (diagnostic) {
        const diff = positions[posIdx].pos - positions[posIdx].htmlPos;
        diagnostic.from += diff;
        diagnostic.to += diff;
        diagnostics.push(diagnostic);
      }
      const nodeName = node.name;
      const result = nodeName !== 'StyleSheet' && nodeName !== 'Script';
      return result;
    });
    return this.makeUnique(diagnostics);
  }

  private validateMustache(node: SyntaxNodeRef): Diagnostic | null {
    if (node.name === 'UnescapedTag') {
      return {
        from: node.from,
        to: node.to,
        severity: environment.severityHtmlFragmentValidation,
        message: 'Renders variables with unescaped HTML',
      };
    }
    if (node.name === 'MissingCloseSectionTag') {
      return {
        from: node.from,
        to: node.to,
        severity: 'error',
        message: 'Missing closing tag',
      };
    }
    if (node.name === 'MismatchedCloseSectionTag') {
      return {
        from: node.from,
        to: node.to,
        severity: 'error',
        message: 'Mismatching closing tag',
      };
    }
    if (node.type.isError && node.to !== 0) {
      return {
        from: node.from,
        to: node.to,
        severity: 'error',
        message: 'Invalid mustache template',
      };
    }
    return null;
  }

  private validateHtml(html: string, node: SyntaxNodeRef): Diagnostic | null {
    if (node.name === 'TagName' && node.node.parent?.name === 'OpenTag') {
      const value = html.substring(node.from, node.to).toLowerCase();
      if (!this.settings.allowedTags.has(value.toLowerCase())) {
        return {
          from: node.from,
          to: node.to,
          severity: environment.severityHtmlFragmentValidation,
          message: 'Unexpected tag',
        };
      }
    }
    if (node.name === 'AttributeName') {
      const value = html.substring(node.from, node.to).toLowerCase();
      if (!this.settings.allowedAttributes.has(value.toLowerCase())) {
        return {
          from: node.from,
          to: node.to,
          severity: environment.severityHtmlFragmentValidation,
          message: 'Unexpected attribute',
        };
      }
    }
    if (node.name == 'UnquotedAttributeValue') {
      return {
        from: node.from,
        to: node.to,
        severity: environment.severityHtmlFragmentValidation,
        message: 'Attributes should be quoted',
      };
    } else if (node.type.isError && node.to !== 0) {
      return {
        from: node.from,
        to: node.to,
        severity: 'error',
        message: 'Invalid html',
      };
    }
    return null;
  }

  private makeUnique(diagnostics: Diagnostic[]): Diagnostic[] {
    const hashes = new Set<string>();
    return diagnostics.filter((d) => {
      const hash = `${d.from}-${d.to}-${d.message}`;
      if (hashes.has(hash)) {
        return false;
      }
      hashes.add(hash);
      return true;
    });
  }
}
