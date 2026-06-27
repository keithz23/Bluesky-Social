"use client";

import { useEffect, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type BackToTopProps = {
  scrollContainerRef?: RefObject<HTMLElement | null>;
};

export default function BackToTop({ scrollContainerRef }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;

    const toggleVisibility = () => {
      const scrollTop = scrollContainer?.scrollTop ?? window.scrollY;

      if (scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    toggleVisibility();

    const target = scrollContainer ?? window;
    target.addEventListener("scroll", toggleVisibility, { passive: true });

    return () => target.removeEventListener("scroll", toggleVisibility);
  }, [scrollContainerRef]);

  const scrollToTop = () => {
    const scrollContainer = scrollContainerRef?.current;
    const options: ScrollToOptions = {
      top: 0,
      behavior: "smooth",
    };

    if (scrollContainer) {
      scrollContainer.scrollTo(options);
      return;
    }

    window.scrollTo(options);
  };

  return (
    <Button
      variant="default"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        "fixed z-50 rounded-full shadow-xl transition-all duration-300 ease-in-out cursor-pointer",

        "bottom-20 right-4",
        "md:bottom-8 md:right-8",

        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-10 scale-0 pointer-events-none",
      )}
    >
      <ArrowUp className="h-5 w-5" />
      <span className="sr-only">Back to top</span>
    </Button>
  );
}
