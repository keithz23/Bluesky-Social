import { isSystemFeedSlug, SYSTEM_FEEDS } from './feed-catalog';

describe('feed catalog', () => {
  it('contains unique, routable slugs', () => {
    const slugs = SYSTEM_FEEDS.map((feed) => feed.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every(isSystemFeedSlug)).toBe(true);
  });

  it('rejects unknown feed slugs', () => {
    expect(isSystemFeedSlug('not-a-feed')).toBe(false);
  });
});
