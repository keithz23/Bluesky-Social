export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map((m) => m.slice(1)) : [];
};

//ex
// "Hello @john và @jane"
// → ['john', 'jane']
