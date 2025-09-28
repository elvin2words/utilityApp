// mockEscalations.ts

import { Escalation } from "@/src/types/fault";

export const mockEscalations: Escalation[] = [
  {
    id: "e1",
    faultId: "f1", // Transformer Explosion (critical, Harare)
    level: 1,
    reason: "High customer impact (2,500+ affected)",
    createdAt: "2025-09-20T09:00:00Z",
    status: "open",
  },
  {
    id: "e2",
    faultId: "f4", // Gas Leak (Kwekwe Industrial Zone)
    level: 2,
    reason: "Potential safety hazard in industrial zone",
    createdAt: "2025-09-22T06:45:00Z",
    status: "acknowledged",
  },
  {
    id: "e3",
    faultId: "f7", // Fiber Optic Cut (Chitungwiza Highway)
    level: 1,
    reason: "Extended outage due to third-party roadworks",
    createdAt: "2025-09-19T16:30:00Z",
    status: "resolved",
  },
];




timeline: {
  reported: "2025-09-22T06:00:00Z",
  acknowledged: "2025-09-22T06:05:00Z",
  dispatched: "2025-09-22T06:15:00Z",
  escalated: "2025-09-22T06:30:00Z",
  logs: [
    {
      event: "reported",
      timestamp: "2025-09-22T06:00:00Z",
      actorId: "user123",
      note: "Gas leak detected by sensor",
    },
    {
      event: "escalated",
      timestamp: "2025-09-22T06:30:00Z",
      note: "Escalated to Level 2 — Potential safety hazard in industrial zone",
    },
  ],
},
