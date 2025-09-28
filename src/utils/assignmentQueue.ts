// lib/assignmentQueue.ts

import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";


type PendingAssignment = {
  faultId: string;
  assigneeId?: string; // for single user
  teamId?: string;     // for team assignment
  timestamp: number;
};

const PENDING_ASSIGNMENTS_KEY = "pending_assignments_queue";

export async function getPendingAssignments(): Promise<PendingAssignment[]> {
  const data = await AsyncStorage.getItem(PENDING_ASSIGNMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addPendingAssignment(assignment: PendingAssignment) {
  const current = await getPendingAssignments();
  current.push(assignment);
  await AsyncStorage.setItem(PENDING_ASSIGNMENTS_KEY, JSON.stringify(current));
}

export async function clearPendingAssignments() {
  await AsyncStorage.removeItem(PENDING_ASSIGNMENTS_KEY);
}
