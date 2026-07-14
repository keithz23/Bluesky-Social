import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

type DateLike = Date | string | number | null | undefined;

export const formatCompactDate = (date?: DateLike) => {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), {
    addSuffix: false,
    locale: enUS,
  })
    .replace(/^about\s/, "")
    .replace(/^almost\s/, "")
    .replace(/^over\s/, "")
    .replace("less than a minute", "now")
    .replace(/\s?minutes?/, "m")
    .replace(/\s?hours?/, "h")
    .replace(/\s?days?/, "d")
    .replace(/\s?months?/, "mo")
    .replace(/\s?years?/, "y");
};

export const formatFullDate = (date?: DateLike) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCount = (count: number, label: string) => {
  if (count <= 0) return null;
  return `${count.toLocaleString()} ${label}${count === 1 ? "" : "s"}`;
};
