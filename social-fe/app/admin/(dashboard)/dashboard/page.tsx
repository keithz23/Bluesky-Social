"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  FileText,
  Flag,
  RefreshCw,
  ScrollText,
  Server,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCompactDate, formatCompactNumber, formatFullDate } from "@/app/utils/format.util";
import { useDashboard } from "../../hooks/use-dashboard";
import {
  DashboardActivityPoint,
  DashboardRange,
} from "../../interfaces/dashboard.interface";

const ranges: { value: DashboardRange; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const severityClass: Record<string, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Users;
  tone?: "blue" | "violet" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {formatCompactNumber(value)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityChart({ activity }: { activity: DashboardActivityPoint[] }) {
  const max = Math.max(1, ...activity.flatMap((point) => [point.users, point.posts]));

  return (
    <div className="mt-5">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-500" /> New users</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-violet-500" /> Posts</span>
      </div>
      <div className="flex h-48 items-end gap-1.5 border-b border-slate-100 pt-3 sm:gap-2">
        {activity.map((point) => (
          <div key={point.date} className="flex min-w-0 flex-1 flex-col justify-end gap-1" title={`${point.date}: ${point.users} new users, ${point.posts} posts`}>
            <div className="flex h-36 items-end justify-center gap-0.5 sm:gap-1">
              <div className="w-full max-w-3 rounded-t bg-blue-500/85 transition-all" style={{ height: `${Math.max(point.users ? 7 : 0, (point.users / max) * 100)}%` }} />
              <div className="w-full max-w-3 rounded-t bg-violet-500/85 transition-all" style={{ height: `${Math.max(point.posts ? 7 : 0, (point.posts / max) * 100)}%` }} />
            </div>
            <span className="truncate text-center text-[10px] text-slate-400 sm:text-xs">
              {new Date(`${point.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get("range");
  const range: DashboardRange = selected === "24h" || selected === "30d" || selected === "7d" ? selected : "7d";
  const { data, isLoading, isFetching, refetch } = useDashboard(range);

  const updateRange = (value: DashboardRange) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "7d") params.delete("range");
    else params.set("range", value);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  if (isLoading) {
    return <div className="grid min-h-72 place-items-center text-sm text-slate-500">Loading dashboard…</div>;
  }

  if (!data) {
    return <div className="grid min-h-72 place-items-center text-sm text-slate-500">Dashboard data is unavailable. Please try again.</div>;
  }

  const { overview } = data;
  const period = ranges.find((item) => item.value === range)?.label.toLowerCase() ?? "selected period";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Operations dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Monitor growth, content safety, and service readiness from one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={(value) => updateRange(value as DashboardRange)}>
            <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>{ranges.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={overview.totalUsers} detail={`${formatCompactNumber(overview.newUsers)} joined in ${period}`} icon={Users} />
        <MetricCard label="Posts published" value={overview.postsCreated} detail={`${formatCompactNumber(overview.repliesCreated)} replies in ${period}`} icon={FileText} tone="violet" />
        <MetricCard label="Pending reports" value={overview.pendingReports} detail={overview.criticalReports ? `${overview.criticalReports} critical reports need attention` : "No critical reports in queue"} icon={Flag} tone="amber" />
        <MetricCard label="Auto-flagged content" value={overview.autoFlaggedPosts} detail={`Detected during ${period}`} icon={ShieldAlert} tone="red" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>New users and published posts by day.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5"><ActivityChart activity={data.activity} /></CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Server className="size-4 text-blue-600" /> System health</CardTitle>
            <CardDescription>Live dependency check at {formatFullDate(data.health.checkedAt)}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            {([
              ["API", data.health.api],
              ["PostgreSQL", data.health.database],
              ["Redis", data.health.redis],
            ] as const).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="text-sm font-medium text-slate-700">{name}</span>
                <Badge variant="outline" className={status === "healthy" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>{status === "healthy" ? "Healthy" : "Unavailable"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center px-5 pt-5 pb-3">
            <div><CardTitle className="text-base">Priority moderation queue</CardTitle><CardDescription>Oldest pending reports, sorted by severity.</CardDescription></div>
            <Button asChild variant="ghost" size="sm" className="ml-auto"><Link href="/admin/moderation?status=PENDING">Review <ArrowRight /></Link></Button>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {data.moderationQueue.length ? <div className="divide-y divide-slate-100">{data.moderationQueue.map((report) => <div key={report.id} className="py-3 first:pt-0 last:pb-0"><div className="flex gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-800">{report.rule.title}</p><Badge variant="outline" className={severityClass[report.rule.severity]}>{report.rule.severity}</Badge>{report.isAutoGenerated && <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">Automatic</Badge>}</div><p className="mt-1 line-clamp-1 text-sm text-slate-500">{report.post?.content || "Reported content is no longer available."}</p><p className="mt-1 text-xs text-slate-400">{report.user ? `@${report.user.username}` : "Unknown actor"} · {formatCompactDate(report.createdAt)} ago</p></div></div></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500">No pending reports. The moderation queue is clear.</p>}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center px-5 pt-5 pb-3"><div><CardTitle className="text-base">Recent audit activity</CardTitle><CardDescription>Latest administrative and system events.</CardDescription></div><Button asChild variant="ghost" size="sm" className="ml-auto"><Link href="/admin/audit-logs">View logs <ArrowRight /></Link></Button></CardHeader>
          <CardContent className="px-5 pb-5">
            {data.recentAuditLogs.length ? <div className="divide-y divide-slate-100">{data.recentAuditLogs.map((log) => <div key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"><div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{(log.user?.displayName || log.user?.username || "S").slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{log.action}</p><p className="mt-0.5 truncate text-xs text-slate-500">{log.user ? `${log.user.displayName || log.user.username} · ` : "System · "}{log.actorType} · {formatCompactDate(log.createdAt)} ago</p></div></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500">No audit events have been recorded yet.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[{ href: "/admin/moderation?status=PENDING", label: "Review moderation", description: "Resolve reports and apply decisions", icon: ShieldAlert }, { href: "/admin/reports", label: "Browse reports", description: "Inspect community and automated signals", icon: Flag }, { href: "/admin/users", label: "Manage users", description: "Review accounts and permissions", icon: Users }, { href: "/admin/audit-logs", label: "Audit trail", description: "Trace sensitive system activity", icon: ScrollText }].map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"><item.icon className="size-5 text-blue-600" /><p className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-900">{item.label}<ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></p><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></Link>)}
      </section>
    </div>
  );
}
