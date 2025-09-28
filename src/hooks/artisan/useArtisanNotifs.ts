import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/src/api/artisanApi"; 
import { Notification } from "@/src/shared/schema";
import { sortAndGroupNotifications } from "@/src/utils/notificationUtils";
import { useArtisanStore } from "@/src/stores/artisanStore";

export function useArtisanNotifications(userId?: string) {
  const setNotifications = useArtisanStore((s) => s.setNotifications);

  return useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    select: (data) => sortAndGroupNotifications(data),
    refetchInterval: 30_000,
    onSuccess: (data) => setNotifications(data),
  });
}
