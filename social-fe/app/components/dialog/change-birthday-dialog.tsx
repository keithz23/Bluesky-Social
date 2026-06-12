"use client";
import { useAccountSettings } from "@/app/hooks/use-account-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CircleAlert } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type ChangeBirthdayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateOfBirth?: string | Date | null;
};

const MIN_AGE = 13;

const parseInputDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const isAtLeastAge = (dateValue: string, age: number) => {
  if (!dateValue) return false;

  const birthdate = parseInputDate(dateValue);
  if (!birthdate) return false;

  const today = new Date();
  const minBirthdate = new Date(
    today.getFullYear() - age,
    today.getMonth(),
    today.getDate(),
  );

  return birthdate <= minBirthdate;
};

const formatDateForInput = (value?: string | Date | null) => {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
};

export default function ChangeBirthdayDialog({
  open,
  onOpenChange,
  dateOfBirth,
}: ChangeBirthdayDialogProps) {
  const [birthdate, setBirthdate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setBirthdate(formatDateForInput(dateOfBirth));
    setSubmitted(false);
  };

  const { changeBirthDayMutation, isChangingBirthday } = useAccountSettings({
    onSuccess: () => {
      resetForm();
      onOpenChange(false);
    },
  });
  const showAgeError = Boolean(birthdate) && !isAtLeastAge(birthdate, MIN_AGE);
  const canSave = Boolean(birthdate) && !showAgeError;

  useEffect(() => {
    if (open) {
      setBirthdate(formatDateForInput(dateOfBirth));
      setSubmitted(false);
    }
  }, [dateOfBirth, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (!canSave) return;
    changeBirthDayMutation.mutate({ dateOfBirth: birthdate });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <div className="px-5 pb-3 pt-6 text-left">
          <DialogTitle className="text-xl font-bold text-slate-950">
            My birthdate
          </DialogTitle>
          <DialogDescription className="mt-3 text-[15px] leading-5 text-slate-600">
            This information is private and not shared with other users.
          </DialogDescription>
        </div>

        <form className="space-y-4 px-5 pb-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field className="gap-2">
              <Label htmlFor="birthdate" className="sr-only">
                Birthdate
              </Label>
              <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-[#F1F5F9] px-3 transition-colors focus-within:border-blue-600 focus-within:bg-white">
                <Calendar
                  className="mr-3 h-4 w-4 shrink-0 text-slate-700"
                  strokeWidth={2.2}
                />
                <Input
                  id="birthdate"
                  type="date"
                  name="birthdate"
                  autoComplete="bday"
                  value={birthdate}
                  onChange={(event) => {
                    setBirthdate(event.target.value);
                    setSubmitted(false);
                  }}
                  disabled={isChangingBirthday}
                  className="h-full border-0 bg-transparent px-0 py-0 text-[15px] text-slate-950 shadow-none focus-visible:ring-0"
                  required
                />
              </div>
            </Field>
          </FieldGroup>

          {(showAgeError || (submitted && !birthdate)) && (
            <div className="flex gap-2 rounded-lg border border-[#ff1f4b] px-3.5 py-3 text-sm leading-5 text-slate-950">
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-[#ff1f4b]"
                strokeWidth={2.3}
              />
              <p>
                {showAgeError
                  ? "You must be at least 13 years old to use this app. Read our "
                  : "Please enter your birthdate."}
                {showAgeError && (
                  <>
                    <button
                      type="button"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Terms of Service
                    </button>{" "}
                    for more information.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isChangingBirthday || !canSave}
              className="h-11 min-w-20 rounded-full text-[15px] font-semibold disabled:bg-blue-200 disabled:text-white"
            >
              {isChangingBirthday ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
