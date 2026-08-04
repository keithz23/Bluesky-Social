export const SYSTEM_FEEDS = [
  {
    slug: 'discover',
    name: 'Discover',
    description: 'Fresh and popular posts selected from across the community.',
    icon: 'Flame',
    color: 'blue',
  },
  {
    slug: 'following',
    name: 'Following',
    description: 'The latest posts from accounts you follow.',
    icon: 'Users',
    color: 'indigo',
  },
  {
    slug: 'popular',
    name: 'Popular',
    description: 'Posts receiving the most engagement right now.',
    icon: 'Heart',
    color: 'rose',
  },
  {
    slug: 'media',
    name: 'Photos & GIFs',
    description: 'A visual timeline of image and GIF posts.',
    icon: 'Image',
    color: 'violet',
  },
  {
    slug: 'video',
    name: 'Video',
    description: 'Recent video posts from the community.',
    icon: 'Film',
    color: 'slate',
  },
] as const;

export type SystemFeedSlug = (typeof SYSTEM_FEEDS)[number]['slug'];

export const isSystemFeedSlug = (slug: string): slug is SystemFeedSlug =>
  SYSTEM_FEEDS.some((feed) => feed.slug === slug);
