export enum BinarySearchResult {
  EXACT_MATCH,
  GO_HIGHER,
  GO_LOWER,
}

export type ClosestMatchIdx = number;

export function binarySearch(
  listLen: number,
  evalFunc: (idx: number) => BinarySearchResult
): ClosestMatchIdx {
  let lowerIdx = 0;
  let higherIdx = listLen - 1;

  const MAX_ITERATIONS = 1000 * 1000;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const thisIterationIdx = lowerIdx + Math.floor((higherIdx - lowerIdx) / 2);

    const result = evalFunc(thisIterationIdx);

    switch (result) {
      case BinarySearchResult.EXACT_MATCH:
        return thisIterationIdx;
      case BinarySearchResult.GO_HIGHER:
        if (lowerIdx === thisIterationIdx) {
          return thisIterationIdx;
        }
        lowerIdx = thisIterationIdx;
        break;
      case BinarySearchResult.GO_LOWER:
        if (higherIdx === thisIterationIdx) {
          return thisIterationIdx;
        }
        higherIdx = thisIterationIdx;
        break;
    }
  }

  throw new Error("max iterations reached");
}
