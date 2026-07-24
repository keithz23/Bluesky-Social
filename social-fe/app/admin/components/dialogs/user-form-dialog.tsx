import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRole } from "../../hooks/use-role";
import { useUser } from "../../hooks/use-user";

const userSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters."),
  email: z.string().trim().email("Invalid email format."),
  password: z.string().optional(),
  dateOfBirth: z.string().optional(),
  roleIds: z.array(z.string()),
  status: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: any | null;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  userToEdit,
}: UserFormDialogProps) {
  const isEditMode = !!userToEdit;

  const [openCombobox, setOpenCombobox] = useState(false);

  const { roles: rolesResponse, isLoading: isLoadingRoles } = useRole(
    1,
    10,
    true,
  );
  const rolesList = (rolesResponse?.data ?? []) as any[];

  const { createUserMutation, updateUserMutation, isCreating, isUpdating } =
    useUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isValid },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      dateOfBirth: "",
      roleIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        const existingRoleIds =
          userToEdit.userRoles?.map((ur: any) => ur.roleId) || [];
        reset({
          username: userToEdit.username,
          email: userToEdit.email,
          dateOfBirth: userToEdit.dateOfBirth
            ? new Date(userToEdit.dateOfBirth).toISOString().split("T")[0]
            : "",
          password: "",
          roleIds: existingRoleIds,
          status: userToEdit.status || "DEACTIVATED",
        });
      } else {
        reset({
          username: "",
          email: "",
          password: "",
          dateOfBirth: "",
          roleIds: [],
          status: "",
        });
      }
    }
  }, [open, userToEdit, reset]);

  const closeAndReset = () => {
    reset();
    setOpenCombobox(false);
    onOpenChange(false);
  };

  const onSubmit = (data: UserFormValues) => {
    if (!isEditMode && (!data.password || data.password.length < 6)) {
      setError("password", {
        type: "manual",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    const payload = {
      username: data.username,
      email: data.email,
      dateOfBirth: data.dateOfBirth
        ? new Date(data.dateOfBirth).toISOString()
        : undefined,
      roleIds: data.roleIds,
      ...(data.password ? { password: data.password } : {}),
      ...(isEditMode && data.status ? { status: data.status } : {}),
    };

    if (isEditMode && userToEdit) {
      updateUserMutation.mutate(
        { id: userToEdit.id, payload },
        { onSuccess: closeAndReset },
      );
    } else {
      createUserMutation.mutate({ payload }, { onSuccess: closeAndReset });
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeAndReset();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl [&>button]:hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditMode ? "Edit User Info" : "Create User"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update user details and assigned roles."
              : "Create a new account for your organization."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="user-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-1 py-2"
        >
          <div className="space-y-4 mb-8">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold text-gray-900">
                Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="e.g. johndoe"
                  className="bg-slate-50"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  className="bg-slate-50"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">
                  Password{" "}
                  {!isEditMode && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    isEditMode
                      ? "Leave blank to keep current"
                      : "Min 6 characters"
                  }
                  className="bg-slate-50"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="bg-slate-50"
                  {...register("dateOfBirth")}
                />
              </div>

              {isEditMode && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="status">
                    Account Status <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "DEACTIVATED"}
                        value={field.value || "DEACTIVATED"}
                      >
                        <SelectTrigger className="bg-slate-50 w-full">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="DEACTIVATED">
                            Deactivated
                          </SelectItem>
                          <SelectItem value="DELETED">Banned</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-sm text-red-500">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold text-gray-900">Roles</h3>
              <p className="text-sm text-gray-500 mt-1">
                Assign one or multiple roles to this user.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Assigned Roles</Label>
              <Controller
                name="roleIds"
                control={control}
                render={({ field }) => {
                  const selectedRoles = rolesList.filter((role) =>
                    field.value.includes(role.id),
                  );

                  return (
                    <Popover
                      open={openCombobox}
                      onOpenChange={setOpenCombobox}
                      modal={true}
                    >
                      <PopoverTrigger asChild>
                        <div
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="flex min-h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
                        >
                          <div className="flex flex-wrap gap-1">
                            {isLoadingRoles ? (
                              <span className="text-muted-foreground">
                                Loading roles...
                              </span>
                            ) : selectedRoles.length > 0 ? (
                              selectedRoles.map((role) => (
                                <Badge
                                  variant="secondary"
                                  key={role.id}
                                  className="mr-1 bg-white border-slate-200 shadow-sm text-slate-700 hover:bg-slate-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== role.id,
                                      ),
                                    );
                                  }}
                                >
                                  {role.name}
                                  <X className="ml-1 h-3 w-3 hover:text-red-500 cursor-pointer transition-colors" />
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">
                                Select roles...
                              </span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </div>
                      </PopoverTrigger>

                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Search roles..." />
                          <CommandList className="max-h-50 overflow-y-auto">
                            <CommandEmpty>No roles found.</CommandEmpty>
                            <CommandGroup>
                              {rolesList.map((role) => {
                                const isSelected = field.value.includes(
                                  role.id,
                                );
                                return (
                                  <CommandItem
                                    key={role.id}
                                    value={role.name}
                                    onSelect={() => {
                                      if (isSelected) {
                                        field.onChange(
                                          field.value.filter(
                                            (id) => id !== role.id,
                                          ),
                                        );
                                      } else {
                                        field.onChange([
                                          ...field.value,
                                          role.id,
                                        ]);
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 text-blue-600 transition-all",
                                        isSelected
                                          ? "opacity-100 scale-100"
                                          : "opacity-0 scale-50",
                                      )}
                                    />
                                    {role.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={closeAndReset}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="user-form"
            disabled={isLoading || !isValid}
            className="cursor-pointer"
          >
            {isLoading
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
