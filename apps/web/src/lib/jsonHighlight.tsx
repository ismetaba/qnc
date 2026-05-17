import { Fragment, type ReactNode } from 'react';

interface Token {
  kind: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct' | 'whitespace';
  value: string;
}

const TOKEN_RE =
  /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[\{\}\[\],]|\s+)/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(input)) !== null) {
    const v = m[0];
    if (/^\s+$/.test(v)) {
      tokens.push({ kind: 'whitespace', value: v });
    } else if (/^"/.test(v)) {
      // Distinguish key (followed by colon) from string value
      if (/:\s*$/.test(v)) {
        // strip trailing colon for separate punct token; the key includes quoted name + maybe ':'
        const colonIdx = v.lastIndexOf(':');
        const key = v.slice(0, colonIdx).trimEnd();
        tokens.push({ kind: 'key', value: key });
        // re-add colon as punct (preserve any whitespace eaten by trim)
        const punctSlice = v.slice(colonIdx);
        tokens.push({ kind: 'punct', value: punctSlice });
      } else {
        tokens.push({ kind: 'string', value: v });
      }
    } else if (v === 'true' || v === 'false') {
      tokens.push({ kind: 'boolean', value: v });
    } else if (v === 'null') {
      tokens.push({ kind: 'null', value: v });
    } else if (/^-?\d/.test(v)) {
      tokens.push({ kind: 'number', value: v });
    } else {
      tokens.push({ kind: 'punct', value: v });
    }
  }
  return tokens;
}

const CLASS: Record<Token['kind'], string> = {
  key: 'json-key',
  string: 'json-string',
  number: 'json-number',
  boolean: 'json-boolean',
  null: 'json-null',
  punct: 'json-punct',
  whitespace: ''
};

/** Render a JSON-stringified string as syntax-highlighted spans. */
export function highlightJson(input: string): ReactNode {
  const tokens = tokenize(input);
  return tokens.map((t, i) =>
    t.kind === 'whitespace' ? (
      <Fragment key={i}>{t.value}</Fragment>
    ) : (
      <span key={i} className={CLASS[t.kind]} data-token-kind={t.kind}>
        {t.value}
      </span>
    )
  );
}
