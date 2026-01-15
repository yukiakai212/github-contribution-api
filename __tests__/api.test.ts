import { describe, it, expect } from 'vitest';
import { getContributionGraph, buildCacheKey } from '../src/index.js';

const USERNAME = 'yukiakai212';

const TEST_DATE = '2025-07-27';

describe('GitHub Contribution Graph – integration', () => {
  it('should fetch array contribution graph correctly', async () => {
    const graph = await getContributionGraph(USERNAME, {
      year: 2025,
      format: 'array',
      cache: false,
    });

    const day = graph.contributions.find((c) => c.date === TEST_DATE);

    expect(day).toBeDefined();
    expect(day?.count).toBe(16);
    expect(day?.level).toBe(2);
  });

  it('should fetch nested format correctly', async () => {
    const graph = await getContributionGraph(USERNAME, {
      year: 2025,
      format: 'nested',
      cache: false,
    });

    const date = new Date(TEST_DATE);
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();

    const day = graph.contributions[y]?.[m]?.[d];

    expect(day).toBeDefined();
    expect(day.count).toBe(16);
    expect(day.level).toBe(2);
  });

  it('should use cache for same request', async () => {
    const first = await getContributionGraph(USERNAME, {
      year: 2025,
      format: 'nested',
    });

    const second = await getContributionGraph(USERNAME, {
      year: 2025,
      format: 'nested',
    });

    // reference equality → cache hit
    expect(first).toBe(second);
  });

  it('should build deterministic cache key', () => {
    const k1 = buildCacheKey('YukiAkai', {
      year: [2024, 2022],
      format: 'nested',
    });

    const k2 = buildCacheKey('yukiakai', {
      year: [2022, 2024],
      format: 'nested',
    });

    expect(k1).toBe(k2);
  });
});
