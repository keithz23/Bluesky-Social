export function getPaginationRange(
  current: number,
  total: number,
  siblingCount = 1,
) {
  const totalNumbers = siblingCount * 2 + 5; // first, last, current, 2 ellipsis
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  const range: (number | "dots")[] = [1];

  if (showLeftDots) range.push("dots");
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) range.push(i);
  }
  if (showRightDots) range.push("dots");

  range.push(total);
  return range;
}
