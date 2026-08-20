"use client";

import { useState } from "react";
import { Check, Copy, Share } from "lucide-react";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TelegramIcon,
  TelegramShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  TwitterShareButton,
} from "react-share";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Feed } from "@/app/interfaces/feed.interface";

type ShareButtonProps = {
  post: Feed;
};

const NETWORK_BUTTON_CLASS =
  "flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50";

function getShareTitle(post: Feed) {
  const content = post.content?.trim();
  if (!content) return `A post by @${post.user.username} on Konekt`;

  return content.length > 120 ? `${content.slice(0, 117)}...` : content;
}

export default function ShareButton({ post }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const title = getShareTitle(post);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setShareUrl(
        `${window.location.origin}/profile/${post.user.username}/post/${post.id}`,
      );
    }
    setIsOpen(nextOpen);
  };

  const copyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Post link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the post link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Share post"
          className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-2"
        >
          <Share size={18} strokeWidth={2.2} />
        </button>
      </DialogTrigger>

      <DialogContent
        className="w-[calc(100%-2rem)] max-w-lg gap-0 rounded-2xl p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Share post
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Continue the conversation somewhere else.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <FacebookShareButton
            url={shareUrl}
            hashtag="#Konekt"
            disabled={!shareUrl}
            className={NETWORK_BUTTON_CLASS}
          >
            <FacebookIcon size={36} round />
            Facebook
          </FacebookShareButton>

          <TwitterShareButton
            url={shareUrl}
            title={title}
            hashtags={["Konekt"]}
            disabled={!shareUrl}
            className={NETWORK_BUTTON_CLASS}
          >
            <XIcon size={36} round />
            X
          </TwitterShareButton>

          <LinkedinShareButton
            url={shareUrl}
            title={title}
            disabled={!shareUrl}
            className={NETWORK_BUTTON_CLASS}
          >
            <LinkedinIcon size={36} round />
            LinkedIn
          </LinkedinShareButton>

          <TelegramShareButton
            url={shareUrl}
            title={title}
            disabled={!shareUrl}
            className={NETWORK_BUTTON_CLASS}
          >
            <TelegramIcon size={36} round />
            Telegram
          </TelegramShareButton>

          <WhatsappShareButton
            url={shareUrl}
            title={title}
            separator=" — "
            disabled={!shareUrl}
            className={NETWORK_BUTTON_CLASS}
          >
            <WhatsappIcon size={36} round />
            WhatsApp
          </WhatsappShareButton>

          <button
            type="button"
            onClick={copyLink}
            disabled={!shareUrl}
            className={NETWORK_BUTTON_CLASS}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </span>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
