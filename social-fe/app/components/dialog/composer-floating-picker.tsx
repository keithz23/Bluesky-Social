"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { Branch as DismissableLayerBranch } from "@radix-ui/react-dismissable-layer";
import { FloatingPosition } from "@/app/interfaces/dialog/dialog.interface";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface ComposerFloatingPickerProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  width?: number;
  maxHeight?: number;
  onClose: () => void;
  children: ReactNode;
}

export default function ComposerFloatingPicker({
  open,
  anchorRef,
  width = 320,
  maxHeight = 360,
  onClose,
  children,
}: ComposerFloatingPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 12;
      const gap = 10;
      const measuredHeight = panelRef.current?.offsetHeight;
      const panelWidth = Math.min(width, viewportWidth - margin * 2);
      const panelHeight = Math.min(
        measuredHeight && measuredHeight > 0 ? measuredHeight : maxHeight,
        viewportHeight - margin * 2,
      );

      let left = rect.left;
      if (left + panelWidth > viewportWidth - margin) {
        left = viewportWidth - margin - panelWidth;
      }
      left = Math.max(margin, left);

      let top = rect.top - panelHeight - gap;
      if (top < margin) {
        top = rect.bottom + gap;
      }
      top = Math.min(top, viewportHeight - margin - panelHeight);
      top = Math.max(margin, top);

      setPosition({
        top,
        left,
        width: panelWidth,
        maxHeight: panelHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, maxHeight, open, width]);

  useLayoutEffect(() => {
    if (!open || !position) return;

    const frameId = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      if (!panel || !anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 12;
      const gap = 10;
      const panelWidth = Math.min(width, viewportWidth - margin * 2);
      const panelHeight = Math.min(
        panel.offsetHeight,
        viewportHeight - margin * 2,
      );

      let left = rect.left;
      if (left + panelWidth > viewportWidth - margin) {
        left = viewportWidth - margin - panelWidth;
      }
      left = Math.max(margin, left);

      let top = rect.top - panelHeight - gap;
      if (top < margin) {
        top = rect.bottom + gap;
      }
      top = Math.min(top, viewportHeight - margin - panelHeight);
      top = Math.max(margin, top);

      setPosition((current) => {
        const nextPosition = {
          top,
          left,
          width: panelWidth,
          maxHeight: panelHeight,
        };

        if (
          current &&
          current.top === nextPosition.top &&
          current.left === nextPosition.left &&
          current.width === nextPosition.width &&
          current.maxHeight === nextPosition.maxHeight
        ) {
          return current;
        }

        return nextPosition;
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [anchorRef, maxHeight, open, position, width]);

  const isPickerEvent = useCallback(
    (event: Event) => {
      const path = event.composedPath();

      if (panelRef.current && path.includes(panelRef.current)) return true;
      if (anchorRef.current && path.includes(anchorRef.current)) return true;

      const target = event.target;
      return (
        target instanceof Element &&
        Boolean(target.closest("[data-composer-floating-picker='true']"))
      );
    },
    [anchorRef],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (isPickerEvent(event)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPickerEvent, onClose, open]);

  useEffect(() => {
    if (!open || !position) return;

    const panel = panelRef.current;
    if (!panel) return;

    const isScrollable = (element: HTMLElement) => {
      const style = window.getComputedStyle(element);
      const canScroll = element.scrollHeight > element.clientHeight;
      return canScroll && /(auto|scroll|overlay)/.test(style.overflowY);
    };

    const getScrollElement = (target: EventTarget | null) => {
      let element = target instanceof Element ? target : null;

      while (element && panel.contains(element)) {
        if (element instanceof HTMLElement && isScrollable(element)) {
          return element;
        }
        element = element.parentElement;
      }

      const emojiBody = panel.querySelector(".epr-body");
      if (emojiBody instanceof HTMLElement && isScrollable(emojiBody)) {
        return emojiBody;
      }

      return panel;
    };

    const scrollBy = (deltaY: number, target: EventTarget | null) => {
      const scrollElement = getScrollElement(target);
      scrollElement.scrollBy({ top: deltaY });
    };

    let lastTouchY: number | null = null;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      scrollBy(event.deltaY, event.target);
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const nextTouchY = event.touches[0]?.clientY ?? null;
      if (lastTouchY === null || nextTouchY === null) return;

      event.preventDefault();
      event.stopPropagation();
      scrollBy(lastTouchY - nextTouchY, event.target);
      lastTouchY = nextTouchY;
    };

    const clearTouch = () => {
      lastTouchY = null;
    };

    panel.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });
    panel.addEventListener("touchstart", handleTouchStart, {
      capture: true,
      passive: true,
    });
    panel.addEventListener("touchmove", handleTouchMove, {
      capture: true,
      passive: false,
    });
    panel.addEventListener("touchend", clearTouch, true);
    panel.addEventListener("touchcancel", clearTouch, true);

    return () => {
      panel.removeEventListener("wheel", handleWheel, true);
      panel.removeEventListener("touchstart", handleTouchStart, true);
      panel.removeEventListener("touchmove", handleTouchMove, true);
      panel.removeEventListener("touchend", clearTouch, true);
      panel.removeEventListener("touchcancel", clearTouch, true);
    };
  }, [open, position]);

  if (!mounted || !open || !position) return null;

  return createPortal(
    <DismissableLayerBranch asChild>
      <div
        ref={panelRef}
        data-composer-floating-picker="true"
        className="pointer-events-auto overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: position.maxHeight,
          zIndex: 1000,
        }}
      >
        {children}
      </div>
    </DismissableLayerBranch>,
    document.body,
  );
}
