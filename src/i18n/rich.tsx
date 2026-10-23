import { Fragment, type ReactNode } from 'react';

/**
 * One translatable sentence with styled / tappable words inside (a bold e-mail, a "Terms" link):
 *
 *   rich(t('We sent it to {{email}} to verify', slots('email')), { email: <Text style={bold}>{email}</Text> })
 *
 * The whole sentence is one key, so each language keeps its own word order (gluing
 * `t('We sent it to') + email + t('to verify')` breaks French/Japanese/Korean). `slots` passes the
 * placeholders through untouched; `rich` then swaps them for the given nodes.
 */
export function slots(...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, `{{${name}}}`]));
}

export function rich(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return text.split(/(\{\{\w+\}\})/).map((part, index) => {
    const name = /^\{\{(\w+)\}\}$/.exec(part)?.[1];
    return name && name in nodes ? <Fragment key={index}>{nodes[name]}</Fragment> : part;
  });
}
