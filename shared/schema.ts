import { pgTable, text, serial, integer, boolean, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadDate: text("upload_date").notNull(),
  metadata: jsonb("metadata"),
});

export const insertMediaSchema = createInsertSchema(mediaFiles).omit({
  id: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
