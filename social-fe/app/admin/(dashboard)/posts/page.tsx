"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EyeOff, MessageSquareWarning, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFullDate } from "@/app/utils/format.util";
import { useAuthStore } from "@/app/store/use-auth.store";
import DataTable from "../../components/table-data";
import { useAdminPosts, useCommunityMutations } from "../../hooks/use-community";
import { AdminPost, PostFilterStatus } from "../../interfaces/community.interface";
import { ColumnDef } from "../../interfaces/column.interface";

const displayName = (post: AdminPost) =>
  post.user.displayName || post.user.username;

export default function PostsManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const status = (searchParams.get("status") || "all") as PostFilterStatus;
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch !== search) updateParams("search", nextSearch);
    }, 350);
    return () => window.clearTimeout(timeout);
    // updateParams intentionally reads the current URL search params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, search]);

  const { data: response, isLoading } = useAdminPosts({
    page,
    limit,
    status,
    search: search || undefined,
  });
  const { visibilityMutation } = useCommunityMutations();
  const canUpdate = useAuthStore((state) => state.permissions.includes("post:update"));
  const posts = response?.data ?? [];
  const meta = response?.meta ?? { total: 0, totalPages: 1 };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Post",
        cell: (post: AdminPost) => (
          <div className="max-w-sm">
            <p className="line-clamp-2 font-medium text-slate-900">{post.content}</p>
            <p className="mt-1 text-xs text-slate-500">
              {post._count.media} media · {post._count.reports} reports
            </p>
          </div>
        ),
      },
      {
        header: "Author",
        cell: (post: AdminPost) => (
          <div>
            <p className="font-medium text-slate-900">{displayName(post)}</p>
            <p className="text-xs text-slate-500">@{post.user.username}</p>
          </div>
        ),
      },
      {
        header: "State",
        className: "whitespace-nowrap",
        cell: (post) => (
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className={post.isDeleted ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}
            >
              {post.isDeleted ? "Hidden" : "Visible"}
            </Badge>
            {post.autoFlagged && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                Flagged
              </Badge>
            )}
          </div>
        ),
      },
      {
        header: "Created",
        className: "whitespace-nowrap text-sm text-slate-600",
        cell: (post) => formatFullDate(post.createdAt),
      },
      ...(canUpdate ? [{
        header: "Action",
        className: "text-right whitespace-nowrap",
        cell: (post: AdminPost) => (
          <Button
            size="sm"
            variant="outline"
            disabled={visibilityMutation.isPending}
            onClick={() =>
              visibilityMutation.mutate({
                postId: post.id,
                isDeleted: !post.isDeleted,
              })
            }
          >
            {post.isDeleted ? <RotateCcw /> : <EyeOff />}
            {post.isDeleted ? "Restore" : "Hide"}
          </Button>
        ),
      }] : []),
    ],
    [canUpdate, visibilityMutation],
  );

  const resetFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  return (
    <div className="flex h-[85vh] w-full flex-col overflow-hidden bg-gray-50/50">
      <div className="mb-5 flex shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <MessageSquareWarning className="size-6 text-blue-600" /> Posts
          </h1>
          <p className="mt-1 text-sm text-gray-500">Review posts and control their visibility.</p>
        </div>
        <p className="text-sm text-slate-500">{meta.total.toLocaleString()} posts</p>
      </div>

      <div className="mb-5 flex shrink-0 flex-wrap gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search post or author" />
        </div>
        <Select value={status} onValueChange={(value: PostFilterStatus) => updateParams("status", value)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All posts</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
        {(search || status !== "all") && <Button variant="ghost" onClick={resetFilters}>Clear filters</Button>}
      </div>

      <DataTable
        data={posts}
        columns={columns}
        isLoading={isLoading}
        tableName="posts"
        page={page}
        limit={limit}
        totalItems={meta.total}
        totalPages={Math.max(meta.totalPages, 1)}
        changePage={(nextPage) => updateParams("page", String(nextPage))}
        changeLimit={(nextLimit) => updateParams("limit", String(nextLimit))}
      />
    </div>
  );
}
