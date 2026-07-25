"use client";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Plus,
  Trash,
  Users,
  ShieldAlert,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "../../interfaces/column.interface";
import { Badge } from "@/components/ui/badge";
import { useUser } from "../../hooks/use-user";
import { useRole } from "../../hooks/use-role";
import DataTable from "../../components/table-data";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/use-auth.store";
import UserFormDialog from "../../components/dialogs/user-form-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCompactNumber } from "@/app/utils/format.util";

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const roleFilter = searchParams.get("role") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const rolesParam = searchParams.get("roles");
  const roleIds = rolesParam ? rolesParam.split(",").filter(Boolean) : [];

  const searchQuery = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      updateURLParams("search", searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const { userData, isUserLoading, deleteUsersMutation, isDeleting } = useUser(
    page,
    limit,
    roleIds,
    statusFilter === "all" ? undefined : statusFilter,
    searchQuery,
  );

  const { roles: rolesResponse } = useRole(1, 10, true);
  const rolesList = (rolesResponse?.data ?? []) as any[];

  const userList = (userData?.data ?? []) as any[];
  const meta = userData?.meta ?? { total: 0, totalPages: 1 };
  const [userToEditInfo, setUserToEditInfo] = useState<any | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const currentUserId = useAuthStore((state) => state.id);
  const permissions = useAuthStore((state) => state.permissions) || [];

  const canCreate = permissions?.includes("user:create") || false;
  const canUpdate = permissions?.includes("user:update") || false;
  const canDelete = permissions?.includes("user:delete") || false;

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const totalItems = meta.total;
  const totalPages = meta.totalPages;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const handleSelectRow = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const selectablePageIds = userList
      .map((user) => user.id)
      .filter((id) => id !== currentUserId);

    if (checked) {
      setSelectedUserIds((prev) =>
        Array.from(new Set([...prev, ...selectablePageIds])),
      );
    } else {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !selectablePageIds.includes(id)),
      );
    }
  };

  const selectablePageIds = userList
    .map((user) => user.id)
    .filter((id) => id !== currentUserId);

  const isAllSelected =
    selectablePageIds.length > 0 &&
    selectablePageIds.every((id) => selectedUserIds.includes(id));

  const handleOpenCreate = () => {
    setUserToEditInfo(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEdit = useCallback((user: any) => {
    setUserToEditInfo(user);
    setIsFormDialogOpen(true);
  }, []);

  const handleDelete = () => {
    deleteUsersMutation.mutate(
      { userIds: selectedUserIds },
      {
        onSuccess: () => {
          setSelectedUserIds([]);
          setIsDeleteDialogOpen(false);
        },
      },
    );
  };

  const scrollToTop = () => {
    const tableContainer = document.querySelector(".table-scroll-container");
    if (tableContainer) {
      tableContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRoleToggle = (roleId: string) => {
    let updatedRoles: string[];
    if (roleIds.includes(roleId)) {
      updatedRoles = roleIds.filter((id) => id !== roleId);
    } else {
      updatedRoles = [...roleIds, roleId];
    }

    const params = new URLSearchParams(searchParams.toString());
    if (updatedRoles.length > 0) {
      params.set("roles", updatedRoles.join(","));
    } else {
      params.delete("roles");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params}`);

    setPage(1);
    setSelectedUserIds([]);
    scrollToTop();
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Username",
        cell: (user) => (
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate">
              {user.username}
            </div>
            {user.id === currentUserId && (
              <Badge variant="outline" className="text-xs shrink-0 bg-gray-50">
                You
              </Badge>
            )}
          </div>
        ),
      },
      {
        header: "Email",
        className: "whitespace-nowrap",
        cell: (user) => (
          <div className="text-gray-600 max-w-50 md:max-w-xs truncate">
            {user.email}
          </div>
        ),
      },
      {
        header: "Status",
        className: "whitespace-nowrap",
        cell: (user) => {
          const isAct = user.status === "ACTIVATED";
          const isBan = user.status === "BANNED";
          return (
            <Badge
              variant="outline"
              className={`${isAct ? "border-green-200 text-green-700 bg-green-50" : isBan ? "border-red-200 text-red-700 bg-red-50" : "border-gray-200 text-gray-600 bg-gray-50"} font-normal`}
            >
              {user.status || "DEACTIVATED"}
            </Badge>
          );
        },
      },
      {
        header: "Roles",
        className: "whitespace-nowrap",
        cell: (user) => (
          <div className="flex flex-wrap gap-1">
            {user.userRoles?.map(
              (ur: { role: { id: string; name: string } }) => (
                <Badge
                  key={ur.role.id}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border-blue-200 font-normal"
                >
                  {ur.role.name}
                </Badge>
              ),
            )}
            {(!user.userRoles || user.userRoles.length === 0) && (
              <span className="text-gray-400 text-sm italic">No roles</span>
            )}
          </div>
        ),
      },
      {
        header: "Actions",
        className: "text-right whitespace-nowrap",
        cell: (user) => {
          const isSelf = user.id === currentUserId;
          return (
            <div className="flex items-center justify-end gap-2">
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
                  disabled={isSelf}
                  onClick={() => handleOpenEdit(user)}
                  title={
                    isSelf
                      ? "Cannot change your own role or user info"
                      : "Edit User Info"
                  }
                >
                  <Pen className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [currentUserId, canUpdate, handleOpenEdit],
  );

  const updateURLParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");

    router.push(`${pathname}?${params}`);
  };

  const changePage = (newPage: number) => {
    updateURLParams("page", String(newPage));
    setPage(newPage);
    setSelectedUserIds([]);

    scrollToTop();
  };

  const changeLimit = (newLimit: number) => {
    updateURLParams("limit", String(newLimit));
    setLimit(newLimit);
    setPage(1);
    setSelectedUserIds([]);
  };

  const handleFilterChange = (type: "role" | "status", value: string) => {
    updateURLParams(type, value);
    setPage(1);
    setSelectedUserIds([]);
    scrollToTop();
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("roles");
    params.delete("status");
    params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params}`);

    setPage(1);
    setSelectedUserIds([]);
    setSearchTerm("");
    scrollToTop();
  };

  const hasActiveFilters =
    roleIds.length > 0 || statusFilter !== "all" || searchQuery !== "";

  return (
    <>
      <div className="w-full h-[85vh] overflow-hidden flex flex-col bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600 shrink-0" />
              Users Management
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Create users and attach roles to them.
            </p>
          </div>
          <div className="flex items-center gap-x-3">
            {canDelete && selectedUserIds.length > 0 && (
              <Button
                variant="destructive"
                className="w-full sm:w-auto shadow-sm cursor-pointer rounded-md transition-all"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash className="w-4 h-4 mr-2 shrink-0" /> Delete (
                {selectedUserIds.length})
              </Button>
            )}

            {canCreate && (
              <Button
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer rounded-md"
                onClick={handleOpenCreate}
              >
                <Plus className="w-4 h-4 mr-2 shrink-0" /> Create New User
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-5 shrink-0">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* SEARCH INPUT */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {/* MULTI-SELECT ROLE FILTER */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-48 bg-white justify-between font-normal text-gray-700 border-gray-200"
                >
                  <span>
                    {roleIds.length === 0
                      ? "Filter by Role"
                      : `Roles (${roleIds.length} selected)`}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Filter by Roles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {rolesList.map((role) => {
                  const isSelected = roleIds.includes(role.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={role.id}
                      checked={isSelected}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                      onSelect={(e) => e.preventDefault()} // Giữ menu mở khi click chọn nhiều cái
                    >
                      {role.name}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* STATUS FILTER */}
            <Select
              value={statusFilter}
              onValueChange={(val) => handleFilterChange("status", val)}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Account Status</SelectLabel>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Activated</SelectItem>
                  <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                  <SelectItem value="DELETED">Banned</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* CLEAR FILTERS BUTTON */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Showing{" "}
            <span className="font-medium">
              {startItem}–{endItem}
            </span>{" "}
            of{" "}
            <span className="font-medium">
              {formatCompactNumber(totalItems)}
            </span>{" "}
            users
          </p>
        </div>

        <DataTable
          tableName="users"
          data={userList}
          columns={columns}
          isLoading={isUserLoading}
          page={page}
          limit={limit}
          totalItems={totalItems}
          totalPages={totalPages}
          changePage={changePage}
          changeLimit={changeLimit}
          enableSelection={canDelete}
          selectedIds={selectedUserIds}
          isAllSelected={isAllSelected}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          disabledRowIds={currentUserId ? [currentUserId] : []}
        />
      </div>

      <UserFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        userToEdit={userToEditInfo}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{" "}
              <strong>{selectedUserIds.length}</strong> selected user(s)? This
              action cannot be undone, and all associated data for these users
              might be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
