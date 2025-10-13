// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgEnum, pgTableCreator } from "drizzle-orm/pg-core";
import { text, timestamp, boolean } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `tkd-core_${name}`);
export const attendanceStatus = pgEnum("attendance_status", [
  "present",
  "absent",
  "excused",
]);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const user = createTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = createTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
  impersonatedBy: text("impersonated_by"),
});

export const account = createTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = createTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const organization = createTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const member = createTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").default("member").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const invitation = createTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const ranks = createTable("ranks", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 250 }).notNull().unique(),
  prevRank: d.varchar({ length: 250 }).notNull(),
  nextRank: d.varchar({ length: 250 }).notNull(),
}));

export const rankRequirement = createTable("rankRequirement", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  rankId: d
    .integer()
    .notNull()
    .references(() => ranks.id, { onDelete: "cascade" }),
  name: d.varchar({ length: 250 }).notNull(),
  levelNeeded: d.smallint().notNull(), // to pass to the next rank
  isTimeRequired: d.boolean().default(false),
}));

export const rankPromotion = createTable("rankPromotion", (d) => ({
  fromRank: d
    .integer()
    .notNull()
    .references(() => ranks.id, { onDelete: "cascade" }),
  toRank: d
    .integer()
    .notNull()
    .references(() => ranks.id, { onDelete: "cascade" }),
  success: d.boolean(),
  observations: d.text(),
  coachId: d
    .integer()
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  studentId: d
    .integer()
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
}));

export const persons = createTable("persons", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  firstName: d.varchar({ length: 200 }).notNull(),
  height: d.bigint({ mode: "number" }).notNull(),
  weight: d.bigint({ mode: "number" }).notNull(),
  lastName: d.varchar({ length: 200 }).notNull(),
  currentRank: d
    .integer()
    .notNull()
    .references(() => ranks.id, { onDelete: "cascade" }),
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
  userId: d
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isCoach: d.boolean().notNull().default(false),
  birthDate: d.timestamp("birthDate").notNull(),
}));

export const groups = createTable("groups", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 200 }).notNull(),
}));

export const personGroup = createTable("personGroup", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  personId: d
    .integer()
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  groupId: d
    .integer()
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
  removedAt: d.timestamp("removed_at"),
}));

export const classSession = createTable("classSession", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  startTime: d.timestamp("start_time").notNull(),
  endTime: d.timestamp("end_time").notNull(),
  coachId: d
    .integer("coach_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
}));

export const classSessionGroup = createTable("classSessionGroup", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  sessionId: d
    .integer("session_id")
    .notNull()
    .references(() => classSession.id, { onDelete: "cascade" }),
  groupId: d
    .integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
}));

export const attendance = createTable("attendance", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  sessionId: d
    .integer("session_id")
    .notNull()
    .references(() => classSession.id, { onDelete: "cascade" }),
  personId: d
    .integer("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  status: attendanceStatus("status").notNull(),
  description: d.text(),
}));

export const rankRequirementPerson = createTable(
  "rankRequirementPerson",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    requirementId: d
      .integer("requirement_id")
      .notNull()
      .references(() => rankRequirement.id, { onDelete: "cascade" }),
    personId: d
      .integer("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    level: d.smallint().notNull(),
  }),
);
