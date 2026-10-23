import { describe, expect, it } from '@jest/globals';
import { rich, slots } from '@/i18n/rich';

describe('rich', () => {
  it('replaces placeholders with nodes and keeps the rest of the sentence', () => {
    const parts = rich('We sent it to {{email}} to verify', { email: 'NODE' });
    expect(parts.filter((part) => typeof part === 'string')).toEqual(['We sent it to ', ' to verify']);
    expect(parts).toHaveLength(3);
  });

  it('passes placeholders through untouched', () => {
    expect(slots('a', 'b')).toEqual({ a: '{{a}}', b: '{{b}}' });
  });
});
