import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface EditableProfile {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

interface EditProfileModalProps {
  profile?: EditableProfile | null;
}

export default function EditProfileModal({ profile }: EditProfileModalProps) {
  const { updateProfileMutation, isUpdating } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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

  const hydrateForm = () => {
    setDisplayName(initialDisplayName);
    setDescription(initialBio);
    setAvatar(initialAvatar);
    setCoverPhoto(initialCover);
    setAvatarFile(undefined);
    setCoverFile(undefined);
  };

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
    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      setIsOpen(false);
      resetForm();
    }
  };

  const handleConfirmDiscard = () => {
    resetForm();
    setShowExitConfirm(false);
    setIsOpen(false);
  };

  const handleSave = () => {
    const data = {
      displayName,
      bio: description,
      ...(avatarFile && { avatarFile }),
      ...(coverFile && { coverFile }),
    };
    updateProfileMutation.mutate(
      { updateProfileData: data },
      {
        onError: (error) => {
          console.error("Update profile error:", error);
        },
      },
    );
    setIsOpen(false);
  };

  const isSaveDisabled =
    !hasChanges || displayName.trim() === "" || isUpdating;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            hydrateForm();
            setIsOpen(true);
            return;
          }

          handleCloseAttempt();
        }}
      >
        <DialogTrigger asChild>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm px-4 py-1.5 rounded-full transition cursor-pointer">
            Edit Profile
          </button>
        </DialogTrigger>

        <DialogContent
          className="sm:max-w-125 p-0 gap-0 overflow-hidden rounded-xl"
          onInteractOutside={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
        >
          <DialogHeader className="flex flex-row items-center justify-between p-3 border-b border-border/50 space-y-0">
            <Button
              variant="ghost"
              onClick={handleCloseAttempt}
              className="text-blue-600 hover:text-blue-700 hover:bg-transparent text-base font-normal px-2 cursor-pointer"
            >
              Cancel
            </Button>

            <DialogTitle className="text-base font-semibold">
              Edit profile
            </DialogTitle>

            <Button
              variant="ghost"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={`text-base font-normal px-2 hover:bg-transparent ${
                isSaveDisabled
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
            <div className="pt-14 px-5 pb-6 space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="displayName"
                  className="text-slate-600 font-medium"
                >
                  Display name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alice Lastname"
                  className="bg-[#f1f5f9] border-transparent focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:bg-white text-base py-6 shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-slate-600 font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us a bit about yourself"
                  className="bg-[#f1f5f9] border-transparent focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:bg-white text-base min-h-30 resize-none shadow-none"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogTitle className="sr-only"></DialogTitle>
          <DialogContent
            className="w-full max-w-62.5 rounded-[32px] bg-white p-6 shadow-xl border-none gap-0 z-100 [&>button]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Discard changes?
              </h2>
              <p className="text-[15px] leading-snug text-gray-600 mb-6">
                Are you sure you want to discard your changes?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmDiscard}
                  className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#E42240] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#c91d37]"
                >
                  Discard
                </button>

                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#F1F5F9] py-3.5 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
