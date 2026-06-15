import { toast } from "sonner";
import { useAuthStore } from "../store/use-auth.store";

export const useRequireAuthAction = () => {
  return () => {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      toast.info("Please log in to continue.");
      return false;
    }

    return true;
  };
};
