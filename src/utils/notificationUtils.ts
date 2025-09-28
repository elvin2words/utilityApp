import { Notification } from "@/shared/schema";

export function sortAndGroupNotifications(notifs: Notification[]): Notification[] {
  const priorityOrder: Record<string, number> = {
    critical: 3,
    alert: 2,
    new_assignment: 1,
    default: 0,
  };
  return [...notifs].sort((a, b) => {
    const prioA = priorityOrder[a.type] ?? 0;
    const prioB = priorityOrder[b.type] ?? 0;
    if (prioA === prioB) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return prioB - prioA;
  });
}
