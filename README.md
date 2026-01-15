# GitHub Contribution Graph API (Node.js)

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-downloads-url]

[![Build Status][github-build-url]][github-url]
[![codecov][codecov-image]][codecov-url]

Fetch and parse GitHub contribution graphs directly in Node.js, without running a separate HTTP service.

* ✅ Node-first API
* ✅ Supports multiple years
* ✅ Array or nested formats
* ✅ Built-in LRU cache
* ✅ Deterministic cache keys

---

## Installation

```bash
npm install github-contribution-graph-api
```

---

## Usage

### Basic

```ts
import { getContributionGraph } from 'github-contribution-graph-api'

const graph = await getContributionGraph('yukiakai')
```

Defaults:

* `year`: `'last'`
* `format`: `'array'`
* `cache`: `true`

---

### Specify year(s)

```ts
await getContributionGraph('yukiakai', {
  year: 2024,
})
```

```ts
await getContributionGraph('yukiakai', {
  year: [2022, 2023, 2024],
})
```

```ts
await getContributionGraph('yukiakai', {
  year: 'all',
})
```

---

### Output formats

#### Array (default)

```ts
const graph = await getContributionGraph('yukiakai', {
  format: 'array',
})
```

```ts
{
  total: {
    2024: 532,
    lastYear: 489
  },
  contributions: [
    { date: '2024-01-01', count: 3, level: 2 },
    { date: '2024-01-02', count: 0, level: 0 },
    ...
  ]
}
```

---

####  Nested

```ts
const graph = await getContributionGraph('yukiakai', {
  format: 'nested',
})
```

```ts
{
  total: {
    2024: 532,
    lastYear: 489
  },
  contributions: {
    2024: {
      1: {
        1: { date: '2024-01-01', count: 3, level: 2 },
        2: { date: '2024-01-02', count: 0, level: 0 }
      }
    }
  }
}
```

Nested structure:
`[year][month][day] → Contribution`

---

## API

### `getContributionGraph(username, options?)`

```ts
getContributionGraph(
  username: string,
  options?: GetContributionGraphOptions
): Promise<ContributionGraph | NestedContributionGraph>
```

#### Options

```ts
interface GetContributionGraphOptions {
  year?: 'all' | 'last' | number | number[]
  format?: 'array' | 'nested'
  cache?: boolean
}
```

---

## Caching

* Built-in **LRU cache**
* Keyed by:

  ```
  username + year + format
  ```
* Cache enabled by default
* TTL: 1 hour

Disable cache if needed:

```ts
await getContributionGraph('yukiakai', {
  cache: false,
})
```

---

## Limitations

* Relies on GitHub’s public contribution graph
* If GitHub changes its markup, parsing logic may need updates
* No authentication support (public profiles only)

---

## Inspiration

This project was inspired by  
**github-contributions-api** by **grubersjoe**

---

## License

MIT © [Yuki Akai](https://github.com/yukiakai212)



---

[npm-downloads-image]: https://badgen.net/npm/dm/github-contribution-graph-api
[npm-downloads-url]: https://www.npmjs.com/package/github-contribution-graph-api
[npm-url]: https://www.npmjs.com/package/github-contribution-graph-api
[npm-version-image]: https://badgen.net/npm/v/github-contribution-graph-api
[github-build-url]: https://github.com/yukiakai212/github-contribution-graph-api/actions/workflows/build.yml/badge.svg
[github-url]: https://github.com/yukiakai212/github-contribution-graph-api/
[codecov-image]: https://codecov.io/gh/yukiakai212/github-contribution-graph-api/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/yukiakai212/github-contribution-graph-api
[changelog-url]: https://github.com/yukiakai212/github-contribution-graph-api/blob/main/CHANGELOG.md
[api-docs-url]: https://yukiakai212.github.io/github-contribution-graph-api/
