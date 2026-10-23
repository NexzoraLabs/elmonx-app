import { describe, expect, it } from '@jest/globals';
import { ApiError, appendUnique, assertSuccess, readJson, uniqueBy } from '@/services/http';

describe('appendUnique', () => {
  const key = (item: { id: string }) => item.id;

  it('drops rows that are already in the list (offset paging repeats rows)', () => {
    const prev = [{ id: 'a' }, { id: 'b' }];
    expect(appendUnique(prev, [{ id: 'b' }, { id: 'c' }], key).map(key)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the same array when nothing is new', () => {
    const prev = [{ id: 'a' }];
    expect(appendUnique(prev, [{ id: 'a' }], key)).toBe(prev);
  });

  it('removes duplicates inside one page', () => {
    expect(uniqueBy([{ id: 'x' }, { id: 'x' }, { id: 'y' }], key).map(key)).toEqual(['x', 'y']);
  });
});

describe('assertSuccess', () => {
  it('returns data for a successful body', () => {
    expect(assertSuccess({ status: 200, data: 5 })).toBe(5);
  });

  it('throws the backend message for HTTP-200 logical failures', () => {
    expect(() => assertSuccess({ status: 400, message: 'Duplicate username' })).toThrow('Duplicate username');
    expect(() => assertSuccess({ success: false, message: 'Nope' })).toThrow(ApiError);
  });

  it('treats body status 201 as an error only when asked', () => {
    expect(assertSuccess({ status: 201, data: 1 })).toBe(1);
    expect(() => assertSuccess({ status: 201, message: 'Blocked' }, { rejectStatus201: true })).toThrow('Blocked');
  });
});

describe('readJson', () => {
  it('turns an HTML error page into a readable error instead of a JSON parse crash', async () => {
    const response = { text: async () => '<html>502 Bad Gateway</html>' } as Response;
    await expect(readJson(response)).rejects.toThrow(ApiError);
  });

  it('parses JSON', async () => {
    const response = { text: async () => '{"status":200}' } as Response;
    await expect(readJson(response)).resolves.toEqual({ status: 200 });
  });
});
