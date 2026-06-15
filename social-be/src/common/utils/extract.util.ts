export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map((match) => match.slice(1)) : [];
};

export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#([A-Za-z0-9_]+)/g;
  const matches = content.match(hashtagRegex);
  if (!matches) return [];

  return [...new Set(matches.map((match) => match.slice(1).toLowerCase()))];
};
