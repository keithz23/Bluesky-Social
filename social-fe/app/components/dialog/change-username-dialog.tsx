"use client";
import { useAccountSettings } from "@/app/hooks/use-account-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign } from "lucide-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";

interface ChangeUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const changeUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(50, "Username must be 50 characters or less."),
});

type ChangeUsernameValues = z.infer<typeof changeUsernameSchema>;

export default function ChangeUsernameDialog({
  open,
  onOpenChange,
}: ChangeUsernameDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ChangeUsernameValues>({
    resolver: zodResolver(changeUsernameSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
    },
  });

  const resetForm = () => {
    reset();
  };

  const { changeUsernameMutation, isChangingUsername } = useAccountSettings({
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleChangeUsername: SubmitHandler<ChangeUsernameValues> = (data) => {
    changeUsernameMutation.mutate({ username: data.username });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="relative flex h-12 items-center justify-center border-b border-gray-200 px-5">
          <DialogClose asChild>
            <button
              type="button"
              className="absolute left-5 text-[15px] font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChangingUsername}
            >
              Cancel
            </button>
          </DialogClose>
          <DialogTitle className="text-base font-bold text-slate-950">
            Change Handle
          </DialogTitle>
        </div>

        <form
          className="space-y-5 px-5 py-5"
          onSubmit={handleSubmit(handleChangeUsername)}
        >
          <FieldGroup>
            <Field className="gap-2">
              <Label
                htmlFor="username"
                className="text-[15px] font-medium text-slate-600"
              >
                New handle
              </Label>
              <div
                className={`flex h-11 items-center rounded-xl border bg-[#F1F5F9] px-3 transition-within focus-within:bg-white ${
                  errors.username
                    ? "border-red-500 ring-red-500"
                    : "border-blue-600"
                }`}
              >
                <AtSign
                  className="mr-2 h-5 w-5 shrink-0 text-blue-600"
                  strokeWidth={2.2}
                />
                <Input
                  id="username"
                  inputMode="text"
                  autoComplete="username"
                  placeholder="e.g. alice"
                  aria-invalid={Boolean(errors.username)}
                  {...register("username")}
                  disabled={isChangingUsername}
                  className="h-full border-0 bg-transparent px-0 py-0 text-[15px] text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
              {errors.username && (
                <p className="ml-1 text-xs font-medium text-red-500">
                  {errors.username.message}
                </p>
              )}
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            disabled={isChangingUsername || !isValid}
            className="h-11 w-full rounded-full text-[15px] font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
          >
            {isChangingUsername ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
