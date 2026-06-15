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
import { AtSign } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type ChangeUsernameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ChangeUsernameDialog({
  open,
  onOpenChange,
}: ChangeUsernameDialogProps) {
  const [username, setUsername] = useState("");
  const { changeUsernameMutation, isChangingUsername } = useAccountSettings({
    onSuccess: () => {
      onOpenChange(false);
    },
  });
  const resetForm = () => {
    setUsername("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleChangeUsername = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      toast.error("Username is required");
      return;
    }

    changeUsernameMutation.mutate({ username: trimmedUsername });
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

        <form className="space-y-5 px-5 py-5" onSubmit={handleChangeUsername}>
          <FieldGroup>
            <Field className="gap-2">
              <Label
                htmlFor="username"
                className="text-[15px] font-medium text-slate-600"
              >
                New handle
              </Label>
              <div className="flex h-11 items-center rounded-xl border border-blue-600 bg-[#F1F5F9] px-3 transition-within focus-within:bg-white">
                <AtSign
                  className="mr-2 h-5 w-5 shrink-0 text-blue-600"
                  strokeWidth={2.2}
                />
                <Input
                  id="username"
                  name="username"
                  inputMode="text"
                  autoComplete="username"
                  placeholder="e.g. alice"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isChangingUsername}
                  className="h-full border-0 bg-transparent px-0 py-0 text-[15px] text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
                  required
                />
              </div>
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            disabled={isChangingUsername || !username.trim()}
            className="h-11 w-full rounded-full text-[15px] font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
          >
            {isChangingUsername ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
