// /assets/data/mockAdminData.ts

import { User, Team, SLARule, Escalation, Shift, Schedule, ActivityLog } from "@/src/types";

export const mockUsers: User[] = [
  { id: "u1", name: "Alice Moyo", role: "Engineer", status: "active" },
  { id: "u2", name: "Tinashe Dube", role: "Supervisor", status: "active" },
  { id: "u3", name: "Chipo Ndlovu", role: "Dispatcher", status: "inactive" },
  { id: "u4", name: "Brian Zhou", role: "Engineer", status: "active" },
  { id: "u5", name: "Rufaro Nyathi", role: "Supervisor", status: "active" },
  { id: "u6", name: "Tariro Chikafu", role: "Engineer", status: "active" },
  { id: "u7", name: "Kudzai Mlambo", role: "Technician", status: "active" },
  { id: "u8", name: "Nomsa Sibanda", role: "Engineer", status: "active" },
];

export const mockTeams: Team[] = [
  { id: "t1", name: "Central Ops", members: ["u1", "u2", "u3"] },
  { id: "t2", name: "Southern Field Team", members: ["u4", "u5"] },
  { id: "t3", name: "Northern Response", members: ["u6", "u7", "u8"] },
];

export const mockSlaRules: SLARule[] = [
  { id: "sla1", severity: "low", responseTime: "24h" },
  { id: "sla2", severity: "medium", responseTime: "8h" },
  { id: "sla3", severity: "high", responseTime: "4h" },
  { id: "sla4", severity: "critical", responseTime: "1h" },
];

export const mockEscalations: Escalation[] = [
  { id: "esc1", severity: "high", level: 1, assignedTo: "u2" },
  { id: "esc2", severity: "high", level: 2, assignedTo: "u5" },
  { id: "esc3", severity: "critical", level: 1, assignedTo: "u5" },
  { id: "esc4", severity: "critical", level: 2, assignedTo: "u2" },
];

export const mockShifts: Shift[] = [
  { id: "s1", name: "Day Shift", members: ["u1", "u4", "u6"], time: "08:00–16:00" },
  { id: "s2", name: "Night Shift", members: ["u2", "u5", "u7"], time: "16:00–00:00" },
  { id: "s3", name: "Weekend Shift", members: ["u3", "u8"], time: "08:00–20:00" },
];

export const mockSchedules: Schedule[] = [
  { id: "sch1", userId: "u1", date: "2025-09-27", shiftId: "s1" },
  { id: "sch2", userId: "u2", date: "2025-09-27", shiftId: "s1" },
  { id: "sch3", userId: "u4", date: "2025-09-27", shiftId: "s2" },
  { id: "sch4", userId: "u5", date: "2025-09-27", shiftId: "s2" },
  { id: "sch5", userId: "u6", date: "2025-09-28", shiftId: "s3" },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: "log1", userId: "u1", action: "Created new fault report", timestamp: "2025-09-27T08:15:00Z" },
  { id: "log2", userId: "u2", action: "Updated SLA rule", timestamp: "2025-09-27T09:05:00Z" },
  { id: "log3", userId: "u3", action: "Dismissed notification", timestamp: "2025-09-27T10:20:00Z" },
  { id: "log4", userId: "u5", action: "Escalated fault", timestamp: "2025-09-27T11:45:00Z" },
  { id: "log5", userId: "u6", action: "Completed assignment", timestamp: "2025-09-27T13:10:00Z" },
  { id: "log6", userId: "u8", action: "Acknowledged alert", timestamp: "2025-09-27T14:30:00Z" },
];
