import { PostHashtagService } from './post-hashtag.service';

describe('PostHashtagService', () => {
  it('upserts hashtags and links them to the post', async () => {
    const tx = {
      hashtag: {
        upsert: jest
          .fn()
          .mockResolvedValueOnce({ id: 'tag-1' })
          .mockResolvedValueOnce({ id: 'tag-2' }),
      },
      postHashtag: { createMany: jest.fn() },
    };
    const service = new PostHashtagService();

    await service.attachHashtags(tx as any, 'post-1', ['nestjs', 'testing']);

    expect(tx.hashtag.upsert).toHaveBeenCalledWith({
      where: { name: 'nestjs' },
      create: { name: 'nestjs', postCount: 1 },
      update: { postCount: { increment: 1 } },
      select: { id: true },
    });
    expect(tx.postHashtag.createMany).toHaveBeenCalledWith({
      data: [
        { postId: 'post-1', hashtagId: 'tag-1' },
        { postId: 'post-1', hashtagId: 'tag-2' },
      ],
      skipDuplicates: true,
    });
  });

  it('does nothing when there are no hashtags', async () => {
    const tx = {
      hashtag: { upsert: jest.fn() },
      postHashtag: { createMany: jest.fn() },
    };
    const service = new PostHashtagService();

    await service.attachHashtags(tx as any, 'post-1', []);

    expect(tx.hashtag.upsert).not.toHaveBeenCalled();
    expect(tx.postHashtag.createMany).not.toHaveBeenCalled();
  });
});
