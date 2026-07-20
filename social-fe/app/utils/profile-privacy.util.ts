import type { User } from "../interfaces/user.interface";

export const isProfilePrivateLocked = (profile?: User | null) => {
  return Boolean(
    profile?.isPrivate &&
      !profile.isOwner &&
      profile.followStatus !== "following",
  );
};
