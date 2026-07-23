"use client";
import { Button } from "@/components/ui/button";
import { Pen, Plus, Users } from "lucide-react";
import { useState } from "react";
import { ColumnDef } from "../../interfaces/column.interface";
import { Badge } from "@/components/ui/badge";
import { useUser } from "../../hooks/use-user";
import DataTable from "../../components/table-data";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { userData, isUserLoading } = useUser(page, limit);
  const userList = (userData?.data ?? []) as any[];
  const meta = userData?.meta ?? { total: 0, totalPages: 1 };

  const totalItems = meta.total;
  const totalPages = meta.totalPages;
  const columns: ColumnDef<any>[] = [
    {
      header: "Username",
      cell: (user) => (
        <>
          <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate">
            {user.username}
          </div>
        </>
      ),
    },
    {
      header: "Email",
      className: "whitespace-nowrap",
      cell: (user) => (
        <div className="font-semibold text-gray-900 max-w-50 md:max-w-xs truncate">
          {user.email}
        </div>
      ),
    },
    {
      header: "Roles",
      className: "whitespace-nowrap",
      cell: (user) => (
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          {user.userRoles.map((ur) => ur.role.name)}
        </Badge>
      ),
    },
    {
      header: "Actions",
      className: "text-right whitespace-nowrap",
      cell: (user) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-200 hover:bg-gray-100"
            // onClick={() => handleOpenEdit(role)}
            title="Edit User Info"
          >
            <Pen className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];
  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params}`);
    setPage(newPage);
  };
  return (
    <>
      <div className="w-full h-[85vh] overflow-hidden flex flex-col bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
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
            {/* {selectedRoleIds.length > 0 && (
              <Button
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-sm rounded-md transition-all cursor-pointer"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="w-4 h-4 mr-2 shrink-0" /> Delete (
                {selectedRoleIds.length})
              </Button>
            )} */}

            <Button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer rounded-md"
              //   onClick={handleOpenCreate}
            >
              <Plus className="w-4 h-4 mr-2 shrink-0" /> Create New User
            </Button>
          </div>
        </div>

        <DataTable
          tableName="users"
          data={userList}
          columns={columns}
          isLoading={isUserLoading}
          // Pagination
          page={page}
          limit={limit}
          totalItems={totalItems}
          totalPages={totalPages}
          changePage={changePage}
          // Select
          enableSelection={true}
          //   selectedIds={selectedRoleIds}
          //   isAllSelected={isAllSelected}
          //   onSelectRow={handleSelectRole}
          //   onSelectAll={handleSelectAll}
        />
      </div>
    </>
  );
}
