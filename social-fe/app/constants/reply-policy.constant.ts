import { Ban, Globe, Users } from "lucide-react";

export const REPLY_POLICY_CONFIG = {
  ANYONE: {
    text: "Everybody can reply",
    icon: Globe,
  },
  NOBODY: {
    text: "Replies disabled",
    icon: Ban,
  },
  CUSTOM: {
    text: "Some people can reply",
    icon: Users,
  },
};
