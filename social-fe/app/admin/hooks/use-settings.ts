import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrMsg } from "@/app/utils/error.util";
import { UpdateSystemSettingsPayload } from "../interfaces/system-setting.interface";
import { SettingsService } from "../services/settings.service";

const SETTINGS_QUERY_KEY = ["admin-system-settings"] as const;

export const useSystemSettings = () =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: SettingsService.findAll,
    staleTime: 30_000,
  });

export function useSystemSettingsMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSystemSettingsPayload) => SettingsService.update(payload),
    onSuccess: () => {
      toast.success("System settings saved");
      invalidate();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  const resetMutation = useMutation({
    mutationFn: SettingsService.reset,
    onSuccess: () => {
      toast.success("Settings reset to defaults");
      invalidate();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  return { updateMutation, resetMutation };
}
