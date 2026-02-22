import { useQuery } from "@tanstack/react-query";
import { UserService } from "../services/user.service";

// Use useMutation for only data changes like (POST, PUT, DELETE)
export const useProfile = (username: string) => {
  return useQuery({
    queryKey: ["profile", username],
    queryFn: () => UserService.getProfile(username),
    enabled: !!username,
  });
};
