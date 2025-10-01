// /assets/data/mockAdminData.ts

import { User, Team, SLARule, Escalation, Shift, Schedule, ActivityLog } from "@/src/types";

export const mockUsers: User[] = [
  { id: "u1", name: "Alice Moyo", role: "Engineer", status: "active", phone: "+263 77 123 4567", email: "alice.moyo@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T10:15:00Z" },
  { id: "u2", name: "Amos Chipfuwamiti", role: "Supervisor", status: "active", phone: "+263 77 234 5678", email: "amos.chipfuwamiti@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T09:50:00Z" },
  { id: "u3", name: "Henry Landelani Ndlovu", role: "Dispatcher", status: "inactive", phone: "+263 77 345 6789", email: "henry.ndlovu@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-28T17:30:00Z" },
  { id: "u4", name: "Blessing Guramatunhu", role: "Artisan", status: "active", phone: "+263 77 456 7890", email: "blessing.guramatunhu@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T11:00:00Z" },
  { id: "u5", name: "Brian Zhou", role: "Engineer", status: "active", phone: "+263 77 567 8901", email: "brian.zhou@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T10:45:00Z" },
  { id: "u6", name: "Rufaro Nyathi", role: "Supervisor", status: "active", phone: "+263 77 678 9012", email: "rufaro.nyathi@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T08:50:00Z" },
  { id: "u7", name: "Tariro Chikafu", role: "Engineer", status: "active", phone: "+263 77 789 0123", email: "tariro.chikafu@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T10:20:00Z" },
  { id: "u8", name: "Nolan Manyuchi", role: "Artisan", status: "active", phone: "+263 77 890 1234", email: "nolan.manyuchi@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T09:40:00Z" },
  { id: "u9", name: "Nomsa Sibanda", role: "Engineer", status: "active", phone: "+263 77 901 2345", email: "nomsa.sibanda@utility.co.zw", region: "Chinhoyi North", lastActive: "2025-09-30T10:05:00Z" },
];

export const mockTeams: Team[] = [
  { id: "t1", name: "Chinhoyi Central Ops", members: ["u1", "u2", "u3"], region: "Chinhoyi North" },
  { id: "t2", name: "Banket Field Team", members: ["u4", "u5"], region: "Chinhoyi North" },
  { id: "t3", name: "Northern Response", members: ["u6", "u7", "u8"], region: "Chinhoyi North" },
];

export const mockSlaRules: SLARule[] = [
  { id: "sla1", severity: "low", responseTime: "24h", name: "Minor Fault Response", description: "Response to minor low-impact faults within 24 hours." },
  { id: "sla2", severity: "medium", responseTime: "8h", name: "Moderate Fault Response", description: "Response to medium-priority faults affecting multiple customers." },
  { id: "sla3", severity: "high", responseTime: "4h", name: "Major Fault Response", description: "High-severity faults impacting critical infrastructure addressed within 4 hours." },
  { id: "sla4", severity: "critical", responseTime: "1h", name: "Critical Fault Response", description: "Critical faults with immediate customer impact responded to within 1 hour." },
];

export const mockEscalations: Escalation[] = [
  { id: "esc1", severity: "high", level: 1, assignedTo: "u2", jobId: "job101", reason: "Transformer failure", createdAt: "2025-09-27T09:00:00Z", status: "open" },
  { id: "esc2", severity: "high", level: 2, assignedTo: "u5", jobId: "job102", reason: "Line outage", createdAt: "2025-09-27T09:30:00Z", status: "in-progress" },
  { id: "esc3", severity: "critical", level: 1, assignedTo: "u5", jobId: "job103", reason: "Substation fault", createdAt: "2025-09-27T10:15:00Z", status: "open" },
  { id: "esc4", severity: "critical", level: 2, assignedTo: "u2", jobId: "job104", reason: "Grid failure", createdAt: "2025-09-27T10:45:00Z", status: "resolved" },
];

export const mockShifts: Shift[] = [
  { id: "s1", name: "Day Shift", members: ["u1", "u4", "u6"], start: "08:00", end: "16:00", supervisor: "u2" },
  { id: "s2", name: "Night Shift", members: ["u2", "u5", "u7"], start: "16:00", end: "00:00", supervisor: "u6" },
  { id: "s3", name: "Weekend Shift", members: ["u3", "u8"], start: "08:00", end: "20:00", supervisor: "u2" },
];

export const mockSchedules: Schedule[] = [
  { id: "sch1", user_id: "u1", date: "2025-09-27", shiftId: "s1", title: "Inspect Substation 3", assignedUser: "u1" },
  { id: "sch2", user_id: "u2", date: "2025-09-27", shiftId: "s1", title: "Supervise Day Shift", assignedUser: "u2" },
  { id: "sch3", user_id: "u4", date: "2025-09-27", shiftId: "s2", title: "Repair Transformer T7", assignedUser: "u4" },
  { id: "sch4", user_id: "u5", date: "2025-09-27", shiftId: "s2", title: "Line Maintenance", assignedUser: "u5" },
  { id: "sch5", user_id: "u6", date: "2025-09-28", shiftId: "s3", title: "Oversee Weekend Ops", assignedUser: "u6" },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: "log1", user_id: "u1", description: "Created new fault report", timestamp: "2025-09-27T08:15:00Z" },
  { id: "log2", user_id: "u2", description: "Updated SLA rule", timestamp: "2025-09-27T09:05:00Z" },
  { id: "log3", user_id: "u3", description: "Dismissed notification", timestamp: "2025-09-27T10:20:00Z" },
  { id: "log4", user_id: "u5", description: "Escalated fault", timestamp: "2025-09-27T11:45:00Z" },
  { id: "log5", user_id: "u6", description: "Completed assignment", timestamp: "2025-09-27T13:10:00Z" },
  { id: "log6", user_id: "u8", description: "Acknowledged alert", timestamp: "2025-09-27T14:30:00Z" },
  { id: "log1", user_id: "u1", description: "Created new fault report", timestamp: "2025-09-27T08:15:00Z" },
  { id: "log2", user_id: "u2", description: "Updated SLA rule", timestamp: "2025-09-27T09:05:00Z" },
  { id: "log3", user_id: "u3", description: "Dismissed notification", timestamp: "2025-09-27T10:20:00Z" },
  { id: "log4", user_id: "u5", description: "Escalated fault", timestamp: "2025-09-27T11:45:00Z" },
  { id: "log5", user_id: "u6", description: "Completed assignment", timestamp: "2025-09-27T13:10:00Z" },
  { id: "log6", user_id: "u8", description: "Acknowledged alert", timestamp: "2025-09-27T14:30:00Z" },

];
