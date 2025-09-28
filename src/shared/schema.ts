import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
  
// Users model for both technicians and supervisors
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "technician" or "supervisor"
  phone: text("phone"),
  email: text("email"),
  team: text("team"),
  shift: text("shift"),
  status: text("status").default("available"), // available, on_duty, off_duty, on_break, standby
  profile_image: text("profile_image"),
  employee_id: text("employee_id").unique(),
  current_location: jsonb("current_location"), // { lat: number, lng: number, timestamp: string }
  is_online: boolean("is_online").default(false),
  last_seen: timestamp("last_seen"),
});

// Fault types model
export const faultTypes = pgTable("fault_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  estimated_resolution_time: integer("estimated_resolution_time"), // in minutes
  safety_doc_url: text("safety_doc_url"),
});

// Faults model for reported issues
export const faults = pgTable("faults", {
  id: serial("id").primaryKey(),
  reference_number: text("reference_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  location_name: text("location_name").notNull(),
  severity: text("severity").notNull(), // critical, moderate, low
  priority: text("priority").notNull(), // high, medium, low
  status: text("status").notNull(), // pending, in_progress, resolved
  reported_time: timestamp("reported_time").notNull(),
  estimated_completion_time: timestamp("estimated_completion_time"),
  dispatch_time: timestamp("dispatch_time"),
  arrival_time: timestamp("arrival_time"),
  departure_time: timestamp("departure_time"),
  resolution_time: timestamp("resolution_time"),
  fault_type_id: integer("fault_type_id"),
  coordinates: jsonb("coordinates"), // { lat: number, lng: number }
  geofence: jsonb("geofence"), // { lat: number, lng: number, radius: number }
  remarks: text("remarks"),
  materials_used: text("materials_used"),
  weather_conditions: text("weather_conditions"),
  created_by: integer("created_by"),
  closed_by: integer("closed_by"),
});

// Assignments model connecting technicians to faults
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  fault_id: integer("fault_id").notNull(),
  technician_id: integer("technician_id").notNull(),
  assigned_time: timestamp("assigned_time").notNull(),
  assigned_by: integer("assigned_by").notNull(),
  status: text("status").notNull(), // assigned, accepted, completed, delayed
  delay_reason: text("delay_reason"),
});

// Logs model for system activities
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  action: text("action").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  ip_address: text("ip_address"),
  related_fault_id: integer("related_fault_id"),
});

// Analytics model for performance metrics
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  saidi: real("saidi"), // System Average Interruption Duration Index
  saifi: real("saifi"), // System Average Interruption Frequency Index
  caidi: real("caidi"), // Customer Average Interruption Duration Index
  total_faults: integer("total_faults"),
  resolved_faults: integer("resolved_faults"),
  avg_resolution_time: integer("avg_resolution_time"),
  technician_id: integer("technician_id"),
  fault_type_distribution: jsonb("fault_type_distribution"), // { type_id: count }
  location_distribution: jsonb("location_distribution"), // { location_name: count }
});

// Notifications model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  read: boolean("read").default(false),
  type: text("type").notNull(), // new_assignment, status_update, alert, etc.
  related_fault_id: integer("related_fault_id"),
});

// Settings model for user preferences
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().unique(),
  theme: text("theme").default("light"),
  push_notifications: boolean("push_notifications").default(true),
  sound: boolean("sound").default(true),
  vibration: boolean("vibration").default(true),
  auto_sync: boolean("auto_sync").default(true),
  cache_safety_docs: boolean("cache_safety_docs").default(true),
});

// Geofences model for grid network zones
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coordinates: jsonb("coordinates").notNull(), // { lat: number, lng: number }
  radius: real("radius").notNull(), // in meters
  zone_type: text("zone_type").notNull(), // "fault_zone", "restricted_area", "depot", "substation"
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"), // additional zone-specific data
});

// Location tracking for technicians
export const locationTracking = pgTable("location_tracking", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  coordinates: jsonb("coordinates").notNull(), // { lat: number, lng: number }
  timestamp: timestamp("timestamp").defaultNow(),
  accuracy: real("accuracy"), // GPS accuracy in meters
  speed: real("speed"), // in km/h
  bearing: real("bearing"), // direction in degrees
  is_inside_geofence: boolean("is_inside_geofence").default(false),
  geofence_id: integer("geofence_id"), // reference to geofence if inside one
  offline_recorded: boolean("offline_recorded").default(false), // for offline sync
});

// Offline data queue for synchronization
export const offlineQueue = pgTable("offline_queue", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  action_type: text("action_type").notNull(), // "update_status", "log_activity", "location_update"
  data: jsonb("data").notNull(), // the actual data to sync
  timestamp: timestamp("timestamp").defaultNow(),
  synced: boolean("synced").default(false),
  sync_attempts: integer("sync_attempts").default(0),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertFaultTypeSchema = createInsertSchema(faultTypes).omit({ id: true });
export const insertFaultSchema = createInsertSchema(faults).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertGeofenceSchema = createInsertSchema(geofences).omit({ id: true });
export const insertLocationTrackingSchema = createInsertSchema(locationTracking).omit({ id: true });
export const insertOfflineQueueSchema = createInsertSchema(offlineQueue).omit({ id: true });

// Login Schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FaultType = typeof faultTypes.$inferSelect;
export type InsertFaultType = z.infer<typeof insertFaultTypeSchema>;
export type Fault = typeof faults.$inferSelect;
export type InsertFault = z.infer<typeof insertFaultSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type LocationTracking = typeof locationTracking.$inferSelect;
export type InsertLocationTracking = z.infer<typeof insertLocationTrackingSchema>;
export type OfflineQueue = typeof offlineQueue.$inferSelect;
export type InsertOfflineQueue = z.infer<typeof insertOfflineQueueSchema>;
export type Login = z.infer<typeof loginSchema>;
