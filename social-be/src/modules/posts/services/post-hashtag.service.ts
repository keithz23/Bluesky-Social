import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostHashtagService {
  async attachHashtags(
    tx: Prisma.TransactionClient,
    postId: string,
    hashtagNames: string[],
  ) {
    if (hashtagNames.length === 0) return;

    const hashtags = await Promise.all(
      hashtagNames.map((name) =>
        tx.hashtag.upsert({
          where: { name },
          create: { name, postCount: 1 },
          update: { postCount: { increment: 1 } },
          select: { id: true },
        }),
      ),
    );

    await tx.postHashtag.createMany({
      data: hashtags.map((hashtag) => ({
        postId,
        hashtagId: hashtag.id,
      })),
      skipDuplicates: true,
    });
  }
}
