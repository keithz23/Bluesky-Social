"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/app/store/use-auth.store";
import {
  useSystemSettings,
  useSystemSettingsMutations,
} from "../../hooks/use-settings";
import {
  SystemSetting,
  UpdateSystemSettingsPayload,
} from "../../interfaces/system-setting.interface";

const defaultDraft: Required<UpdateSystemSettingsPayload> = {
  registrationEnabled: true,
  requireEmailVerification: true,
  maxPostLength: 300,
  keywordScanEnabled: true,
};

const settingValue = <T extends boolean | number>(
  settings: SystemSetting[],
  key: SystemSetting["key"],
  fallback: T,
) =>
  (settings.find((setting) => setting.key === key)?.value as T | undefined) ??
  fallback;

export default function AdminSettingsPage() {
  const { data: settings = [], isLoading } = useSystemSettings();
  const { updateMutation, resetMutation } = useSystemSettingsMutations();
  const canUpdate = useAuthStore((state) =>
    state.permissions.includes("system:update"),
  );
  const [draft, setDraft] = useState(defaultDraft);

  useEffect(() => {
    if (settings.length === 0) return;
    setDraft({
      registrationEnabled: settingValue(
        settings,
        "account.registration_enabled",
        true,
      ),
      requireEmailVerification: settingValue(
        settings,
        "account.require_email_verification",
        true,
      ),
      maxPostLength: settingValue(settings, "content.max_post_length", 300),
      keywordScanEnabled: settingValue(
        settings,
        "moderation.keyword_scan_enabled",
        true,
      ),
    });
  }, [settings]);

  const hasChanges = useMemo(() => {
    if (settings.length === 0) return false;
    return (
      draft.registrationEnabled !==
        settingValue(settings, "account.registration_enabled", true) ||
      draft.requireEmailVerification !==
        settingValue(settings, "account.require_email_verification", true) ||
      draft.maxPostLength !==
        settingValue(settings, "content.max_post_length", 300) ||
      draft.keywordScanEnabled !==
        settingValue(settings, "moderation.keyword_scan_enabled", true)
    );
  }, [draft, settings]);

  const save = () => {
    updateMutation.mutate(draft);
  };

  const reset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => setDraft(defaultDraft),
    });
  };

  const busy = isLoading || updateMutation.isPending || resetMutation.isPending;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Settings2 className="size-6 text-blue-600" /> System settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Runtime controls for account access, content limits, and automated
            moderation. Infrastructure secrets stay in environment
            configuration.
          </p>
        </div>
        {canUpdate && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={reset} disabled={busy}>
              <RotateCcw /> Reset defaults
            </Button>
            <Button onClick={save} disabled={busy || !hasChanges}>
              <Save /> Save changes
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-600" /> Account access
          </CardTitle>
          <CardDescription>
            These controls are enforced by the registration and sign-in
            services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingSwitch
            label="Allow new registrations"
            description="Reject all new sign-up requests while the switch is off."
            checked={draft.registrationEnabled}
            disabled={busy || !canUpdate}
            onCheckedChange={(registrationEnabled) =>
              setDraft((current) => ({ ...current, registrationEnabled }))
            }
          />
          <Separator />
          <SettingSwitch
            label="Require email verification before sign-in"
            description="Unverified accounts cannot receive a session while this is enabled."
            checked={draft.requireEmailVerification}
            disabled={busy || !canUpdate}
            onCheckedChange={(requireEmailVerification) =>
              setDraft((current) => ({ ...current, requireEmailVerification }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-blue-600" /> Content
            controls
          </CardTitle>
          <CardDescription>
            The limit is checked for new posts, post edits, and replies before
            media processing starts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">
                Maximum post and reply length
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Allowed range: 100 to 10,000 characters.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={100}
                max={10000}
                value={draft.maxPostLength}
                disabled={busy || !canUpdate}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxPostLength: Number(event.target.value) || 100,
                  }))
                }
                className="w-28"
              />
              <span className="text-sm text-slate-500">characters</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-600" /> Moderation
            automation
          </CardTitle>
          <CardDescription>
            Changes are propagated through Redis so every backend instance
            refreshes its setting cache.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingSwitch
            label="Automatic keyword scanning"
            description="Evaluate active keyword rules for new and edited posts and replies. Turning this off does not delete existing reports."
            checked={draft.keywordScanEnabled}
            disabled={busy || !canUpdate}
            onCheckedChange={(keywordScanEnabled) =>
              setDraft((current) => ({ ...current, keywordScanEnabled }))
            }
          />
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        Every change is permission-protected and recorded by the audit log
        pipeline. Database, Redis, JWT, mail, and object-storage credentials are
        intentionally not editable here.
      </p>
    </div>
  );
}

function SettingSwitch({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}
