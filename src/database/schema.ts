/* eslint-disable no-empty-pattern */
// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
// schema.ts
import { sql, relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  varchar,
  text,
  timestamp,
  integer,
  json,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `expdynts_${name}`);

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

// Enums
export const estadoExpediente = pgEnum("estado_expediente", [
  "ACTIVE",
  "ARCHIVED",
]);
export const estadoBusqueda = pgEnum("estado_busqueda", [
  "CHECKED",
  "UNCHECKED",
]);

export const extractoEnum = pgEnum("extracto", [
  "ZM",
  "FRNS",
  "PENALT",
  "POPF",
  "LABORAL",
]);

export const expedientes = createTable(
  "expedientes",
  {
    expedienteId: integer().primaryKey().generatedByDefaultAsIdentity(),
    exp: integer("exp").notNull(),
    fecha: integer("fecha").notNull(),
    extracto: extractoEnum("extracto").notNull(),
    cve_juz: varchar("cve_juz", { length: 255 }).notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    acuerdos_json: json("acuerdos_json").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("expedientes_exp_idx").on(t.exp)],
);

export const acuerdosHistorial = createTable(
  "acuerdos_historial",
  {
    acuerdosHistorialId: integer().primaryKey().generatedByDefaultAsIdentity(),
    usuarioExpedienteId: integer("usuario_expediente_id")
      .notNull()
      .references(() => usuarioExpedientes.usuarioExpedientesId, {
        onDelete: "cascade",
      }),
    acuerdos: json("acuerdos").notNull(),
    hash: json("hash").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    index("acuerdos_historial_usuario_exp_idx").on(t.usuarioExpedienteId),
    index("acuerdos_historial_created_idx").on(t.createdAt),
  ],
);

export const usuarios = createTable(
  "usuarios",
  {
    usuarioId: integer().primaryKey().generatedByDefaultAsIdentity(),
    externalId: varchar("external_id", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("usuarios_email_idx").on(t.email)],
);

export const usuarioAttributes = createTable(
  "usuario_attributes",
  {
    usuarioAttributeId: integer("usuario_id")
      .primaryKey()
      .references(() => usuarios.usuarioId, { onDelete: "cascade" }),
    nombre_usuario: varchar("nombre_usuario", { length: 255 }),
    apellido: varchar("apellido", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 15 }),

    preferencias: json("preferencias"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("usuario_attributes_phone_idx").on(t.phoneNumber)],
);

export const usuarioExpedientes = createTable(
  "usuario_expedientes",
  {
    usuarioExpedientesId: integer().primaryKey().generatedByDefaultAsIdentity(),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.usuarioId, { onDelete: "cascade" }),
    expedienteId: integer("expediente_id")
      .notNull()
      .references(() => expedientes.expedienteId, { onDelete: "cascade" }),
    status: estadoExpediente("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("usuario_expediente_unq").on(t.usuarioId, t.expedienteId),
    index("usuario_expedientes_status_idx")
      .on(t.status)
      .where(sql`status = 'ACTIVE'`),
  ],
);

export const busquedaCheck = createTable(
  "busqueda_check",
  {
    busquedaCheckId: integer().primaryKey().generatedByDefaultAsIdentity(),
    status: estadoBusqueda("status").default("CHECKED").notNull(),
    descripcion: text("descripcion"),
    ultimaEjecucion: timestamp("ultima_ejecucion"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("busqueda_check_ejecucion_idx").on(t.ultimaEjecucion)],
);

// Relaciones para usuarios
export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  attributes: one(usuarioAttributes, {
    fields: [usuarios.usuarioId],
    references: [usuarioAttributes.usuarioAttributeId],
  }),
  expedientes: many(usuarioExpedientes),
}));

// Relaciones para usuarioAttributes
export const usuarioAttributesRelations = relations(
  usuarioAttributes,
  ({ one }) => ({
    usuario: one(usuarios, {
      fields: [usuarioAttributes.usuarioAttributeId],
      references: [usuarios.usuarioId],
    }),
  }),
);

// Relaciones para usuarioExpedientes
export const usuarioExpedientesRelations = relations(
  usuarioExpedientes,
  ({ one }) => ({
    usuario: one(usuarios, {
      fields: [usuarioExpedientes.usuarioId],
      references: [usuarios.usuarioId],
    }),
    expediente: one(expedientes, {
      fields: [usuarioExpedientes.expedienteId],
      references: [expedientes.expedienteId],
    }),
  }),
);
// Relaciones para expedientes
export const expedientesRelations = relations(expedientes, ({ many }) => ({
  historialAcuerdos: many(acuerdosHistorial),
  usuarioExpedientes: many(usuarioExpedientes),
}));

// Relación para acuerdosHistorial
// Relaciones para acuerdosHistorial
export const acuerdosHistorialRelations = relations(
  acuerdosHistorial,
  ({ one }) => ({
    usuarioExpediente: one(usuarioExpedientes, {
      fields: [acuerdosHistorial.usuarioExpedienteId],
      references: [usuarioExpedientes.usuarioExpedientesId],
    }),
  }),
);

// Relaciones para busquedaCheck (si tiene relaciones)
export const busquedaCheckRelations = relations(busquedaCheck, ({}) => ({}));

// Tipos para las relaciones (opcional pero recomendado)
export type Usuario = typeof usuarios.$inferSelect;
export type Expediente = typeof expedientes.$inferSelect;
export type UsuarioExpedientes = typeof usuarioExpedientes.$inferSelect;
export type UsuarioExpedienteConExpediente = UsuarioExpedientes & {
  expediente: Expediente;
};
export type UsuarioAtributos = typeof usuarioAttributes.$inferInsert;
