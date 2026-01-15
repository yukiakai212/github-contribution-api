export type Level = 0 | 1 | 2 | 3 | 4;

export type Contribution = {
  date: string;
  count: number;
  level: Level;
};

export type ContributionGraph = {
  total: {
    [year: number]: number;
    [year: string]: number; // 'lastYear;
  };
  contributions: Array<Contribution>;
};

export type NestedContributionGraph = {
  total: {
    [year: number]: number;
    [year: string]: number; // 'lastYear;
  };
  contributions: Record<number, Record<number, Record<number, Contribution>>>; // [y][m][d]
};
export type Format = 'array' | 'nested';

export interface GetContributionGraphOptions {
  year?: 'all' | 'last' | number | number[];
  format?: Format;
  cache?: boolean;
}
