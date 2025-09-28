import React from 'react';
import { v4 as uuidv4 } from "uuid";
import NetInfo from "@react-native-community/netinfo";
import { useFaultStore } from "@/stores/faultStore";
import { useMutationQueue } from "@/stores/mutationQueue";

function FaultModal({ fault, onClose }: any) {
  const { updateFault } = useFaultStore();
  const { enqueue } = useMutationQueue();

  const handleAction = async (type: "COMPLETE" | "DELAY" | "RESOLVE") => {
    // Optimistic UI update
    updateFault(fault.id, { status: type });

    const action = {
      id: uuidv4(),
      faultId: fault.id,
      type,
      createdAt: Date.now(),
    };

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      // try immediate sync
      try {
        await fetch(`https://your-api.com/faults/${fault.id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
      } catch (err) {
        enqueue(action); // fallback
      }
    } else {
      enqueue(action); // offline → queue it
    }

    onClose();
  };

  return (
    <View>
      <Text>{fault.refNo} - {fault.status}</Text>
      <Button title="Complete" onPress={() => handleAction("COMPLETE")} />
      <Button title="Delay" onPress={() => handleAction("DELAY")} />
      <Button title="Resolve" onPress={() => handleAction("RESOLVE")} />
    </View>
  );
}
