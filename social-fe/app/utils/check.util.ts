import { Feed } from "../interfaces/feed.interface";

export const checkCanReply = (post: Feed, currentUser: any) => {
  if (!currentUser) {
    console.log("here");
    return false;
  }

  if (post.user.id === currentUser.id) return true;

  if (post.replyPolicy === "ANYONE") return true;

  if (post.replyPolicy === "NOBODY") return false;

  if (post.replyPolicy === "CUSTOM") {
    if (post.replyFollowers && post.user.followStatus === "following") {
      return true;
    }

    if (post.replyMentioned && currentUser.username) {
      const mentionRegex = new RegExp(`@${currentUser.username}\\b`, "i");
      if (mentionRegex.test(post.content)) {
        return true;
      }
    }

    if (post.replyFollowing) {
      if (post.user.isFollowedByAuthor) {
        return true;
      }
    }
  }

  return false;
};
