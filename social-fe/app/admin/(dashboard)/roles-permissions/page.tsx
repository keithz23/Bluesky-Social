"use client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Zap,
  Check,
  BarChart2,
  CheckSquare,
  Settings2,
  Flag,
  Shield,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import CreateRoleDialog from "../../components/dialogs/create-role-dialog";

interface Role {
  id: number;
  name: string;
  users: number;
  updated: string;
  active?: boolean;
}

interface PermissionItemProps {
  title: string;
  description: string;
  checked: boolean;
  activeStyle?: boolean;
}

const roles: Role[] = [
  {
    id: 1,
    name: "Super Admin",
    users: 3,
    updated: "2h ago",
    active: true,
  },
  {
    id: 2,
    name: "Senior Moderator",
    users: 12,
    updated: "Oct 24, 23",
  },
  {
    id: 3,
    name: "Junior Moderator",
    users: 45,
    updated: "Sep 12, 23",
  },
  {
    id: 4,
    name: "Read-only Support",
    users: 8,
    updated: "Aug 05, 23",
  },
];

const PermissionItem = ({
  title,
  description,
  checked,
  activeStyle = false,
}: PermissionItemProps) => (
  <div
    className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
      activeStyle
        ? "border-indigo-600 bg-indigo-50/40 border-2"
        : "border-gray-200 bg-white"
    }`}
  >
    <div className="flex flex-col pr-4">
      <span className="font-semibold text-sm text-gray-900">{title}</span>
      <span className="text-xs text-gray-500 mt-1 leading-snug">
        {description}
      </span>
    </div>
    <div
      className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      {checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
    </div>
  </div>
);

export default function RolesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  const handleRowClick = (roleId: number) => {
    if (isOpen && selectedRoleId === roleId) {
      setIsOpen(false);
      return;
    }
    setSelectedRoleId(roleId);
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  return (
    <>
      <div className="w-full h-full overflow-hidden bg-gray-50/50 p-6 relative min-h-[calc(100dvh-7rem)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <span className="text-md text-gray-500">
              Configure hierarchical access controls for your moderation team.
            </span>
          </div>

          <Button
            className="cursor-pointer rounded-xs shadow-md"
            onClick={() => {
              setIsCreateRoleDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Role
          </Button>
        </div>

        <div className="flex justify-between py-8 w-full gap-6">
          <Card
            className={`rounded-2xl border shadow-sm transition-all duration-500 ease-in-out shrink-0 ${
              isOpen ? "w-[30%]" : "w-full"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-xl font-semibold">
                Roles List
              </CardTitle>
              <Badge className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700 font-medium text-xs">
                4 ACTIVE ROLES
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-gray-50 hover:bg-gray-50">
                    <TableHead className="pl-6 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      Role Name
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      Users
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 font-semibold hidden lg:table-cell">
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {roles.map((role) => {
                    const isRowActive = isOpen && selectedRoleId === role.id;
                    return (
                      <TableRow
                        key={role.id}
                        className={`h-16 cursor-pointer transition-colors ${
                          isRowActive
                            ? "bg-indigo-50/60"
                            : "hover:bg-indigo-50/40"
                        }`}
                        onClick={() => handleRowClick(role.id)}
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                isRowActive || role.active
                                  ? "bg-blue-600"
                                  : "bg-gray-300"
                              }`}
                            />
                            <span
                              className={`font-semibold ${
                                isRowActive || role.active
                                  ? "text-gray-900"
                                  : "text-gray-600"
                              }`}
                            >
                              {role.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-gray-600">
                          {role.users}
                        </TableCell>

                        <TableCell className="text-gray-500 hidden lg:table-cell">
                          {role.updated}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-gray-500">Showing 1–4 of 12</p>

                <Pagination className="justify-end w-auto mx-0">
                  <PaginationContent className="gap-10">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        className="p-0 w-8 h-8 flex items-center justify-center"
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        className="p-0 w-8 h-8 flex items-center justify-center"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`rounded-2xl shadow-sm overflow-hidden transition-all duration-500 ease-in-out bg-gray-50/30 ${
              isOpen
                ? "w-[70%] opacity-100 border"
                : "w-0 opacity-0 border-none shadow-none"
            }`}
          >
            <div className="min-w-162.5 h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-white">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Permission Configuration
                  </CardTitle>
                  <Badge className="rounded-md bg-blue-50/50 border border-blue-200 px-2 py-1 text-blue-700 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
                    <Zap className="h-3 w-3 fill-current" /> ACTIVE:{" "}
                    {selectedRole.name.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xs px-6 cursor-pointer">
                    Save Changes
                  </Button>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close panel"
                    className="w-9 h-9 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-8 overflow-y-auto">
                <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-2">
                      <BarChart2 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800 text-md">
                        General
                      </h3>
                    </div>
                    <PermissionItem
                      title="Dashboard access"
                      description="View top-level metrics and system health overview."
                      checked={true}
                    />
                    <PermissionItem
                      title="System logs"
                      description="Access detailed activity and system event logs."
                      checked={true}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-2">
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800 text-md">
                        Review Queue
                      </h3>
                    </div>
                    <PermissionItem
                      title="Approve / Reject"
                      description="Perform standard content moderation actions."
                      checked={true}
                    />
                    <PermissionItem
                      title="Suspend / Ban Users"
                      description="Account-level enforcement and disciplinary actions."
                      checked={true}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-2">
                      <Settings2 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800 text-md">
                        Rules & Keywords
                      </h3>
                    </div>
                    <PermissionItem
                      title="Create/Edit Rules"
                      description="Define logic for automated moderation triggers."
                      checked={true}
                    />
                    <PermissionItem
                      title="Manage Keywords"
                      description="Maintain blocked word lists and regular expressions."
                      checked={true}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-2">
                      <Flag className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800 text-md">
                        Appeals
                      </h3>
                    </div>
                    <PermissionItem
                      title="Resolve Appeals"
                      description="Review and override prior moderator decisions."
                      checked={true}
                    />
                    <PermissionItem
                      title="Re-evaluate AI"
                      description="Mark AI decisions for retraining or correction."
                      checked={true}
                    />
                  </div>
                </div>

                <div className="mt-10">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800 text-md">
                      Admin
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-12">
                    <PermissionItem
                      title="Manage Roles"
                      description="Highest level: Modify permissions for other users."
                      checked={true}
                    />
                    <PermissionItem
                      title="System Settings"
                      description="Configure global API, webhooks, and integrations."
                      checked={true}
                      activeStyle={true}
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>

      <CreateRoleDialog
        open={isCreateRoleDialogOpen}
        onOpenChange={setIsCreateRoleDialogOpen}
      />
    </>
  );
}
