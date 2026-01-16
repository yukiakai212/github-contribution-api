import { fromURL, CheerioRequestOptions } from 'cheerio';

import { Element, isText } from 'domhandler';
import {
  GetContributionOptions,
  ContributionResponse,
  NestedContributionResponse,
  Contribution,
  Level,
  Format,
} from './types.js';

export const scrapeContributions = async (
  username: string,
  opts: GetContributionOptions,
): Promise<ContributionResponse | NestedContributionResponse> => {
  let requests = [];

  if (opts.year === 'last') {
    requests.push(scrapeYear(username, 'lastYear', opts.format));
  } else {
    const year: 'all' | number[] =
      opts.year === undefined || opts.year === 'all'
        ? 'all'
        : Array.isArray(opts.year)
          ? opts.year
          : [opts.year];
    const yearLinks = await scrapeYearLinks(username, year);
    requests = yearLinks.map((link) => scrapeYear(username, link.year, opts.format));
  }

  return Promise.all(requests).then((contributions) => {
    if (opts.format === 'nested') {
      return (contributions as Array<NestedContributionResponse>).reduce(
        (resp, curr) => ({
          total: { ...resp.total, ...curr.total },
          contributions: { ...resp.contributions, ...curr.contributions },
        }),
        {
          total: {},
          contributions: {},
        },
      );
    }

    return (contributions as Array<ContributionResponse>).reduce(
      (resp, curr) => {
        return {
          total: { ...resp.total, ...curr.total },
          contributions: [...resp.contributions, ...curr.contributions],
        };
      },
      {
        total: {},
        contributions: [],
      },
    );
  });
};

const scrapeYear = async (
  username: string,
  year: number | 'lastYear',
  format: Format = 'nested',
): Promise<ContributionResponse | NestedContributionResponse> => {
  const url =
    year === 'lastYear'
      ? `https://github.com/users/${username}/contributions`
      : `https://github.com/users/${username}/contributions?tab=overview&from=${year}-12-01&to=${year}-12-31`;

  const $ = await fromURL(url, requestOptions(username));
  const days = $('.js-calendar-graph-table .ContributionCalendar-day');
  const sortedDays = days.get().sort((a, b) => {
    const dateA = a.attribs['data-date'] ?? '';
    const dateB = b.attribs['data-date'] ?? '';

    return dateA.localeCompare(dateB, 'en');
  });

  const totalMatch = /^([0-9,]+)\s/.exec($('.js-yearly-contributions h2').text().trim());

  if (!totalMatch) {
    throw Error('Failed parsing total contributions count');
  }

  const total = parseInt(totalMatch[0].replaceAll(',', ''));

  // Required for contribution count
  const tooltipsByDayId = $('.js-calendar-graph tool-tip')
    .toArray()
    .reduce<Record<string, Element>>((map, elem) => {
      map[elem.attribs.for] = elem;
      return map;
    }, {});

  const response = {
    total: {
      [year]: total,
    },
    contributions: {},
  };

  if (format === 'nested') {
    return sortedDays.reduce<NestedContributionResponse>((data, day) => {
      const { date, contribution } = parseDay(day, tooltipsByDayId);
      const [y, m, d] = date;

      data.contributions[y] ??= {};
      data.contributions[y][m] ??= {};
      data.contributions[y][m][d] = contribution;

      return data;
    }, response);
  }

  return {
    ...response,
    contributions: sortedDays.map(
      (day) => parseDay(day, tooltipsByDayId).contribution,
      tooltipsByDayId,
    ),
  };
};

const parseDay = (day: Element, tooltipsByDayId: Record<string, Element>) => {
  const attr = {
    id: day.attribs.id,
    date: day.attribs['data-date'],
    level: day.attribs['data-level'],
  };

  if (!attr.date) {
    throw Error('Failed parsing contribution date attribute');
  }

  if (!attr.level) {
    throw Error('Failed parsing contribution level attribute');
  }

  let count = 0;

  const text = tooltipsByDayId[attr.id].firstChild;
  if (text && isText(text)) {
    const countMatch = /^\d+/.exec(text.data.trim());
    if (countMatch) {
      count = parseInt(countMatch[0]);
    }
  }

  const level = parseInt(attr.level) as Level;

  if (isNaN(count)) {
    throw Error('Failed parsing contribution count');
  }

  if (isNaN(level)) {
    throw Error('Failed parsing contribution level');
  }

  const contribution = {
    date: attr.date,
    count,
    level,
  } satisfies Contribution;

  return {
    date: attr.date.split('-').map((d: string) => parseInt(d)),
    contribution,
  };
};

const scrapeYearLinks = async (username: string, years: 'all' | Array<number>) => {
  const url = `https://github.com/${username}?action=show&controller=profiles&tab=contributions&user_id=${username}`;
  const $ = await fromURL(url, requestOptions(username));

  return $('.js-year-link')
    .get()
    .map((a) => ({ year: parseInt($(a).text().trim()) }))
    .filter((link) => (years === 'all' ? true : years.includes(link.year)));
};

const requestOptions = (username: string): CheerioRequestOptions => ({
  requestOptions: {
    method: 'GET',
    headers: {
      accept: 'text/html',
      referer: `https://github.com/${username}`,
      'x-requested-with': 'XMLHttpRequest',
    },
  },
});
