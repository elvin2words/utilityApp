import React from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query"; 
import { API_BASE_URL } from "@/src/lib/constants";
import { useArtisanStore } from "@/src/stores/artisanStore";

async function updateTaskStatusOnServer(id: number, status: string) {
  const res = await fetch(`${API_BASE_URL}/faults/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

export function useTaskActions() {
  const { tasks, setTasks } = useArtisanStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateTaskStatusOnServer(id, status),

    // 🟢 Optimistic update
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot old tasks
      const prevTasks = tasks;

      // Update store immediately
      setTasks(
        tasks.map((t) =>
          t.fault.id === id ? { ...t, fault: { ...t.fault, status } } : t
        )
      );

      return { prevTasks };
    },

    // 🔴 Rollback if fails
    onError: (err, vars, ctx) => {
      if (ctx?.prevTasks) setTasks(ctx.prevTasks);
    },

    // ✅ Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    updateStatus: (id: number, status: string) =>
      mutation.mutate({ id, status }),
    isPending: mutation.isPending,
  };
}
