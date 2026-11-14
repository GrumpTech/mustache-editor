import { parseMixed } from '@lezer/common';
import { parser } from '@grumptech/lezer-mustache';
import { LRLanguage, indentNodeProp, LanguageSupport, syntaxTree } from '@codemirror/language';
import { Completion, CompletionContext } from '@codemirror/autocomplete';
import { html, htmlLanguage } from '@codemirror/lang-html';

export interface MustacheLanguageSettings {
  getPartialCompletions(): Completion[];
}

export const mustacheLanguageDefaults: MustacheLanguageSettings = {
  getPartialCompletions: () => [],
};

export function mustacheLanguage(
  settings: MustacheLanguageSettings = mustacheLanguageDefaults,
): LanguageSupport {
  return new LanguageSupport(language, [
    mustacheAutocompletion(settings.getPartialCompletions),
    html().support,
  ]);
}

const mustacheParser = parser.configure({
  props: [
    indentNodeProp.add({
      Element(context) {
        const after = /^(\s*)(<\/)?/.exec(context.textAfter)!;
        if (context.node.to <= context.pos + after[0].length) return context.continue();
        return context.lineIndent(context.node.from);
      },
    }),
  ],
  wrap: parseMixed((node) => {
    return node.type.isTop
      ? {
          parser: htmlLanguage.parser,
          overlay: (node) => node.type.name === 'Content',
        }
      : null;
  }),
});

const language = LRLanguage.define({
  name: 'mustache',
  parser: mustacheParser,
});

function mustacheAutocompletion(getPartialCompletions: () => Completion[]) {
  return language.data.of({
    autocomplete: (context: CompletionContext) => {
      const node = syntaxTree(context.state).resolveInner(context.pos, -1);
      const isKey = node.name === 'TagKey';
      const tagBefore = isKey
        ? node.prevSibling
        : node.name === 'PartialTag'
          ? node.firstChild
          : null;
      const from = isKey ? node.from : context.pos;
      if (
        tagBefore?.name !== 'StartPartialTag' ||
        !/^\s*$/.test(context.state.sliceDoc(tagBefore.to, from))
      ) {
        return null;
      }
      return {
        from: from,
        options: getPartialCompletions(),
      };
    },
  });
}
