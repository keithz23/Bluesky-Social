"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, RotateCcw, ScrollText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCompactNumber, formatFullDate } from "@/app/utils/format.util";
import DataTable from "../../components/table-data";
import { useAuditLogs } from "../../hooks/use-audit-logs";
import { AuditLog } from "../../interfaces/audit-log.interface";
import { ColumnDef } from "../../interfaces/column.interface";

const toDateTimeParam = (date: string, isEndOfDay = false) => {
  if (!date) return undefined;
  return new Date(`${date}T${isEndOfDay ? "23:59:59.999" : "00:00:00"}`).toISOString();
};

const actionBadgeClass = (action: string) => {
  if (action.includes("DELETE")) return "border-red-200 bg-red-50 text-red-700";
  if (action.includes("UPDATE")) return "border-amber-200 bg-amber-50 text-amber-700";
  if (action.includes("CREATE")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const ActorAvatar = ({ actor }: { actor: AuditLog["actor"] }) => {
  const initial = actor?.displayName?.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
      {actor?.avatarUrl ? (
        <img
          src={actor.avatarUrl}
          alt={actor.displayName}
          className="size-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
};

export default function AuditLogsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const action = searchParams.get("action") || "";
  const actorType = searchParams.get("actorType") || "all";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const [actionInput, setActionInput] = useState(action);

  useEffect(() => {
    setActionInput(action);
  }, [action]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (actionInput !== action) updateParams("action", actionInput);
    }, 350);

    return () => window.clearTimeout(timeout);
    // updateParams intentionally reads the latest URL search params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionInput, action]);

  const filters = useMemo(
    () => ({
      page,
      limit,
      action: action || undefined,
      actorType: actorType === "all" ? undefined : actorType,
      from: toDateTimeParam(from),
      to: toDateTimeParam(to, true),
    }),
    [page, limit, action, actorType, from, to],
  );
  const { data: response, isLoading, isError, refetch } = useAuditLogs(filters);
  const auditLogs = response?.data ?? [];
  const meta = response?.meta ?? { total: 0, totalPages: 1 };
  const startItem = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, meta.total);
  const hasActiveFilters = Boolean(action || from || to || actorType !== "all");

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const scrollToTop = () =>
    document
      .querySelector(".table-scroll-container")
      ?.scrollTo({ top: 0, behavior: "smooth" });

  const clearFilters = () => {
    router.push(pathname);
    setActionInput("");
    scrollToTop();
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Action",
      className: "whitespace-nowrap",
      cell: (log) => (
        <Badge variant="outline" className={actionBadgeClass(log.action)}>
          {log.action}
        </Badge>
      ),
    },
    {
      header: "Actor",
      cell: (log) => {
        if (!log.actor) {
          return (
            <div>
              <p className="font-medium text-slate-900">
                {log.userId ? "Deleted user" : "System"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{log.actorType}</p>
            </div>
          );
        }

        return (
          <div className="flex min-w-52 items-center gap-3">
            <ActorAvatar actor={log.actor} />
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{log.actor.displayName}</p>
              <p className="truncate text-xs text-slate-500">@{log.actor.username} · {log.actor.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Source",
      cell: (log) => (
        <div className="max-w-64">
          <p className="truncate text-sm text-slate-700">{log.ipAddress || "—"}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{log.userAgent || "No user agent"}</p>
        </div>
      ),
    },
    {
      header: "Time",
      className: "whitespace-nowrap",
      cell: (log) => (
        <time className="text-sm text-slate-600" dateTime={log.createdAt}>
          {formatFullDate(log.createdAt)}
        </time>
      ),
    },
    {
      header: "Details",
      className: "text-right whitespace-nowrap",
      cell: (log) => (
        <Button
          variant="outline"
          size="sm"
          className="border-slate-200 text-slate-700"
          onClick={() => setSelectedLog(log)}
        >
          <Eye /> View
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex h-[85vh] w-full flex-col overflow-hidden bg-gray-50/50">
        <div className="mb-5 flex shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <ScrollText className="size-6 text-blue-600" /> Audit logs
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review system activity and administrative changes.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        <Separator />

        <div className="my-5 flex shrink-0 flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={actionInput}
                onChange={(event) => setActionInput(event.target.value)}
                placeholder="Filter action, e.g. POST.CREATE"
                className="bg-white pl-9"
              />
            </div>
            <Select value={actorType} onValueChange={(value) => updateParams("actorType", value)}>
              <SelectTrigger className="w-full bg-white sm:w-40"><SelectValue placeholder="Actor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actors</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={from}
              onChange={(event) => updateParams("from", event.target.value)}
              aria-label="Logs from date"
              className="w-full bg-white sm:w-40"
            />
            <Input
              type="date"
              value={to}
              onChange={(event) => updateParams("to", event.target.value)}
              aria-label="Logs to date"
              className="w-full bg-white sm:w-40"
            />
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-slate-600">
                <RotateCcw /> Clear
              </Button>
            )}
          </div>
          <p className="whitespace-nowrap text-sm text-muted-foreground">
            Showing <span className="font-medium">{startItem}–{endItem}</span> of{" "}
            <span className="font-medium">{formatCompactNumber(meta.total)}</span> logs
          </p>
        </div>

        {isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load audit logs. Check your permissions, then try again.
          </div>
        ) : (
          <DataTable
            tableName="audit logs"
            data={auditLogs}
            columns={columns}
            isLoading={isLoading}
            page={page}
            limit={limit}
            totalItems={meta.total}
            totalPages={meta.totalPages}
            changePage={(nextPage) => {
              updateParams("page", String(nextPage));
              scrollToTop();
            }}
            changeLimit={(nextLimit) => updateParams("limit", String(nextLimit))}
          />
        )}
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit log details</DialogTitle>
            <DialogDescription>{selectedLog?.action}</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Log ID</dt><dd className="mt-1 break-all font-mono text-xs text-slate-800">{selectedLog.id}</dd></div>
              <div><dt className="text-slate-500">Actor</dt><dd className="mt-1 flex items-center gap-2 text-slate-800">{selectedLog.actor ? <><ActorAvatar actor={selectedLog.actor} /><span>{selectedLog.actor.displayName}<br /><span className="text-xs text-slate-500">@{selectedLog.actor.username} · {selectedLog.actor.email}</span></span></> : <>{selectedLog.userId ? "Deleted user" : "System"} ({selectedLog.actorType})</>}</dd></div>
              <div><dt className="text-slate-500">IP address</dt><dd className="mt-1 text-slate-800">{selectedLog.ipAddress || "—"}</dd></div>
              <div><dt className="text-slate-500">Created at</dt><dd className="mt-1 text-slate-800">{formatFullDate(selectedLog.createdAt)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">User agent</dt><dd className="mt-1 break-words text-slate-800">{selectedLog.userAgent || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">Metadata</dt><dd className="mt-1 overflow-x-auto rounded-md bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100"><pre>{JSON.stringify(selectedLog.metadata, null, 2) || "—"}</pre></dd></div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
