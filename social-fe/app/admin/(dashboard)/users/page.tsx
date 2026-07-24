"use client";
import { Button } from "@/components/ui/button";
import { Pen, Plus, Trash, Users, ShieldAlert, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ColumnDef } from "../../interfaces/column.interface";
import { Badge } from "@/components/ui/badge";
import { useUser } from "../../hooks/use-user";
import DataTable from "../../components/table-data";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/use-auth.store";
import UserFormDialog from "../../components/dialogs/user-form-dialog";
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

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { userData, isUserLoading, deleteUsersMutation, isDeleting } = useUser(
    page,
    limit,
  );

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

  const handleOpenEdit = (user: any) => {
    setUserToEditInfo(user);
    setIsFormDialogOpen(true);
  };

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

  const columns: ColumnDef<any>[] = [
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
      header: "Roles",
      className: "whitespace-nowrap",
      cell: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.userRoles?.map((ur: { role: { id: string; name: string } }) => (
            <Badge
              key={ur.role.id}
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-200 font-normal"
            >
              {ur.role.name}
            </Badge>
          ))}
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
  ];

  const items = [
    { label: "Select a fruit", value: null },
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Blueberry", value: "blueberry" },
    { label: "Grapes", value: "grapes" },
    { label: "Pineapple", value: "pineapple" },
  ];

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params}`);
    setPage(newPage);
    setSelectedUserIds([]);
  };

  const changeLimit = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`${pathname}?${params}`);
    setLimit(newLimit);
    setPage(1);
  };

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
          <div className="flex items-center gap-3">
            <Select items={items}>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select items={items}>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button variant={"ghost"}>
              <RotateCcw size={5} />
              Clear
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {startItem}–{endItem}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> users
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
