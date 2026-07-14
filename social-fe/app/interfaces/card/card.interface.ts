export const getMediaGridClass = (count: number) => {
  if (count === 1) return "mt-2 mb-2 w-full sm:mb-3";
  if (count === 3) {
    return "mt-2 mb-2 grid h-72 w-full grid-cols-2 grid-rows-2 gap-1 sm:mb-3 sm:h-80";
  }
  return "mt-2 mb-2 grid w-full grid-cols-2 gap-1 sm:mb-3";
};

export const getMediaItemClass = (count: number, index: number) => {
  if (count === 1) return "aspect-video";
  if (count === 3 && index === 0) return "row-span-2 h-full";
  return "aspect-square";
};
