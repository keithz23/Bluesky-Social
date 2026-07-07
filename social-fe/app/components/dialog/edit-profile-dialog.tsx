import React, { useEffect, useState, useRef } from "react";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import * as z from "zod";

interface EditableProfile {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

interface EditProfileModalProps {
  profile?: EditableProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DISPLAY_NAME_MAX_LENGTH = 50;
const BIO_MAX_LENGTH = 100;

const editProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(
      DISPLAY_NAME_MAX_LENGTH,
      `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or less.`,
    ),
  bio: z
    .string()
    .trim()
    .max(BIO_MAX_LENGTH, `Bio must be ${BIO_MAX_LENGTH} characters or less.`),
});

export default function EditProfileModal({
  profile,
  open,
  onOpenChange,
}: EditProfileModalProps) {
  const { updateProfileMutation, isUpdating } = useAuth();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(undefined);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [coverFile, setCoverFile] = useState<File | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initialDisplayName = profile?.displayName ?? "";
  const initialBio = profile?.bio ?? "";
  const initialAvatar = profile?.avatarUrl ?? "";
  const initialCover = profile?.coverUrl ?? "";

  const hasChanges =
    displayName !== initialDisplayName ||
    description !== initialBio ||
    avatar !== initialAvatar ||
    coverPhoto !== initialCover ||
    !!avatarFile ||
    !!coverFile;

  const validationResult = editProfileSchema.safeParse({
    displayName,
    bio: description,
  });
  const validationErrors = validationResult.success
    ? undefined
    : validationResult.error.flatten().fieldErrors;
  const displayNameError = validationErrors?.displayName?.[0];
  const bioError = validationErrors?.bio?.[0];

  const hydrateForm = () => {
    setDisplayName(initialDisplayName);
    setDescription(initialBio);
    setAvatar(initialAvatar);
    setCoverPhoto(initialCover);
    setAvatarFile(undefined);
    setCoverFile(undefined);
  };

  useEffect(() => {
    if (!open) return;

    setDisplayName(initialDisplayName);
    setDescription(initialBio);
    setAvatar(initialAvatar);
    setCoverPhoto(initialCover);
    setAvatarFile(undefined);
    setCoverFile(undefined);
  }, [open, initialDisplayName, initialBio, initialAvatar, initialCover]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverPhoto(URL.createObjectURL(file));
      setCoverFile(file);
    }
  };

  const resetForm = () => {
    hydrateForm();
    setAvatarFile(undefined);
    setCoverFile(undefined);
  };

  const handleCloseAttempt = () => {
    if (isUpdating) return;

    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleConfirmDiscard = () => {
    resetForm();
    setShowExitConfirm(false);
    onOpenChange(false);
  };

  const handleSave = () => {
    const validatedProfile = editProfileSchema.safeParse({
      displayName,
      bio: description,
    });

    if (!validatedProfile.success) return;

    const data = {
      displayName: validatedProfile.data.displayName,
      bio: validatedProfile.data.bio,
      ...(avatarFile && { avatarFile }),
      ...(coverFile && { coverFile }),
    };
    updateProfileMutation.mutate(
      { updateProfileData: data },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
        onError: (error) => {
          console.error("Update profile error:", error);
        },
      },
    );
  };

  const isSaveDisabled =
    !hasChanges || !validationResult.success || isUpdating;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (open) {
            hydrateForm();
            onOpenChange(true);
            return;
          }

          handleCloseAttempt();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-2rem)] max-w-125 max-h-[calc(100dvh-2rem)] p-0 gap-0 overflow-hidden rounded-xl"
          onInteractOutside={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
        >
          <DialogHeader className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3 border-b border-border/50 space-y-0">
            <Button
              variant="ghost"
              onClick={handleCloseAttempt}
              className="justify-self-start text-blue-600 hover:text-blue-700 hover:bg-transparent text-base font-normal px-2 cursor-pointer"
            >
              Cancel
            </Button>

            <DialogTitle className="min-w-0 truncate text-center text-base font-semibold">
              Edit profile
            </DialogTitle>

            <Button
              variant="ghost"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={`justify-self-end text-base font-normal px-2 hover:bg-transparent ${isSaveDisabled
                ? "text-muted-foreground"
                : "text-blue-600 hover:text-blue-700 cursor-pointer"
                }`}
            >
              {isUpdating ? (
                <div className="flex items-center gap-x-1">
                  <Spinner />
                  Saving
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </DialogHeader>

          <div className="relative flex flex-col w-full">
            <input
              type="file"
              hidden
              ref={coverInputRef}
              accept="image/*"
              onChange={handleCoverUpload}
            />
            <input
              type="file"
              hidden
              ref={avatarInputRef}
              accept="image/*"
              onChange={handleAvatarUpload}
            />

            {/* Cover Photo Area */}
            <div
              className="h-32 bg-[#fafafa] relative border-b border-border/50 bg-cover bg-center"
              style={{
                backgroundImage: coverPhoto ? `url(${coverPhoto})` : "none",
              }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-sm cursor-pointer"
                  >
                    <Camera className="h-4 w-4 text-slate-700" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 font-medium text-slate-700"
                >
                  <DropdownMenuItem
                    className="flex justify-between cursor-pointer py-2"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Upload from Files{" "}
                    <ImageIcon className="h-4 w-4 text-slate-500" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Avatar Area */}
            <div className="absolute top-18 left-4">
              <div className="relative h-20 w-20 rounded-full border-[3px] border-white bg-[#ef4444] flex items-center justify-center text-white text-5xl font-light shadow-sm overflow-visible">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  "@"
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-0 -right-1 h-7 w-7 rounded-full bg-white hover:bg-slate-100 shadow-md border border-slate-100 cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5 text-slate-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-48 font-medium text-slate-700"
                  >
                    <DropdownMenuItem
                      className="flex justify-between cursor-pointer py-2"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      Upload from Files{" "}
                      <ImageIcon className="h-4 w-4 text-slate-500" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex justify-between cursor-pointer py-2 border-t mt-1"
                      onClick={() => {
                        setAvatar("");
                        setAvatarFile(undefined);
                      }}
                    >
                      Remove Avatar{" "}
                      <Trash2 className="h-4 w-4 text-slate-500" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Form Fields */}
            <div className="min-w-0 pt-14 px-5 pb-6 space-y-5 overflow-x-hidden">
              <div className="min-w-0 space-y-2">
                <Label
                  htmlFor="displayName"
                  className="text-slate-600 font-medium"
                >
                  Display name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  aria-invalid={Boolean(displayNameError)}
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alice Lastname"
                  className={`max-w-full bg-[#f1f5f9] border-transparent focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:bg-white text-base py-6 shadow-none ${displayNameError ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
                />
                <div className="flex min-w-0 items-center justify-between gap-3">
                  {displayNameError ? (
                    <p className="min-w-0 text-xs font-medium text-red-600 wrap-anywhere]">
                      {displayNameError}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="shrink-0 text-xs text-slate-400">
                    {displayName.length}/{DISPLAY_NAME_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <div className="min-w-0 space-y-2">
                <Label
                  htmlFor="description"
                  className="text-slate-600 font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  aria-invalid={Boolean(bioError)}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={BIO_MAX_LENGTH}
                  placeholder="Tell us a bit about yourself"
                  className={`max-w-full overflow-x-hidden whitespace-pre-wrap wrap-anywhere bg-[#f1f5f9] border-transparent focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:bg-white text-base min-h-30 resize-none shadow-none ${bioError ? "bg-red-50 ring-2 ring-red-500 focus-visible:ring-red-500/30" : ""}`}
                />
                <div className="flex min-w-0 items-center justify-between gap-3">
                  {bioError ? (
                    <p className="min-w-0 text-xs font-medium text-red-600 wrap-anywhere">
                      {bioError}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="shrink-0 text-xs text-slate-400">
                    {description.length}/{BIO_MAX_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogContent
            className="z-100 w-[calc(100vw-2rem)] max-w-90 gap-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl [&>button]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-4">
              <div>
                <DialogTitle className="text-[17px] font-bold text-slate-950">
                  Discard changes?
                </DialogTitle>
                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  Your profile has unsaved changes.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:grid sm:grid-cols-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDiscard}
                  className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#E42240] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c91d37]"
                >
                  Discard
                </button>
              </div>

              <p className="text-center text-xs leading-4 text-slate-400">
                This action cannot be undone.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
