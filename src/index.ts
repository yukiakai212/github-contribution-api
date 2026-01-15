import { LRUCache } from 'lru-cache';
import {
  GetContributionGraphOptions,
  ContributionGraph,
  NestedContributionGraph,
} from './types.js';
import { scrapeContributions } from './github.js';

const cache = new LRUCache<string, ContributionGraph | NestedContributionGraph>({
  max: 500,
  ttl: 1000 * 60 * 60,
});
const DEFAULT_OPTIONS = {
  cache: true,
  year: 'all' as const,
  format: 'array' as const,
};
export function buildCacheKey(username: string, opts?: GetContributionGraphOptions): string {
  const year = opts?.year
    ? Array.isArray(opts?.year)
      ? opts.year.sort().join(',')
      : opts.year
    : '';
  const format = opts?.format ?? '';
  return `${username.toLowerCase()}:${year}:${format}`;
}
function normalizeOptions(opts?: GetContributionGraphOptions) {
  return {
    cache: opts?.cache ?? DEFAULT_OPTIONS.cache,
    format: opts?.format ?? DEFAULT_OPTIONS.format,
    year: opts?.year ?? DEFAULT_OPTIONS.year,
  };
}
export async function getContributionGraph(
  username: string,
  opts?: GetContributionGraphOptions,
): Promise<ContributionGraph | NestedContributionGraph> {
  if (!username) {
    throw new TypeError('username is required');
  }
  const options = normalizeOptions(opts);

  const key = buildCacheKey(username, options);

  if (options.cache) {
    const cached = cache.get(key);
    if (cached) return cached;
  }

  const result = await scrapeContributions(username, options);

  if (options.cache) {
    cache.set(key, result);
  }

  return result;
}
