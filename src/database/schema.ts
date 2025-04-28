// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
// schema.ts
import { sql, relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  varchar,
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

// Enums
export const estadoExpediente = pgEnum("estado_expediente", [
  "ACTIVE",
  "ARCHIVED",
]);
// Tabla de extractos (catálogo principal)
export const extractos = createTable(
  "extractos",
  (d) => ({
    extractoId: d.varchar({ length: 50 }).primaryKey(), // "ZM", "PENALT", "FRNS", etc.
    name: d.varchar({ length: 120 }).notNull(), // "Zona Metropolitana", "Penales", "Foraneos"
    key_search: d.varchar({ length: 100 }), // "zmg", "penal", "forean"
  }),
  (t) => [index("extractos_id_idx").on(t.extractoId)],
);

// Tabla de juzgados (subcatálogo relacionado con extractos)
// ID compuesto como "{extractoId}-{value}" (por ejemplo: "ZM-F02", "PENALT-03P")
export const juzgados = createTable(
  "juzgados",
  {
    juzgadoId: varchar("juzgadoId", { length: 50 }).primaryKey(), // "ZM-F02", "PENALT-03P"
    value: varchar("value", { length: 50 }).notNull(), // "F02", "03P"
    name: varchar("name", { length: 255 }).notNull(), // "JUZGADO SEGUNDO DE LO FAMILIAR", "JUZGADO TERCERO DE LO PENAL"
    judge: varchar("judge", { length: 100 }).notNull(), // "ZM", "PENALT" (igual al extractoId)
    key_search: varchar("key_search", { length: 100 }), // "zmg", "penal"
    extractoId: varchar("extracto_id", { length: 50 })
      .notNull()
      .references(() => extractos.extractoId, { onDelete: "cascade" }),
  },
  (t) => [
    index("juzgados_value_idx").on(t.value),
    index("juzgados_judge_idx").on(t.judge),
    index("juzgados_extracto_idx").on(t.extractoId),
  ],
);

export const expedientes = createTable(
  "expedientes",
  {
    expedienteId: integer().primaryKey().generatedByDefaultAsIdentity(),
    exp: integer("exp").notNull(),
    fecha: integer("fecha").notNull(),
    cve_juz: varchar("cve_juz", { length: 255 }).notNull(),
    juzgadoId: varchar("juzgado_id", { length: 50 }).references(
      () => juzgados.juzgadoId,
      { onDelete: "set null" },
    ),
    url: varchar("url", { length: 255 }).notNull(),
    acuerdos_json: json("acuerdos_json").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("expedientes_exp_idx").on(t.exp),
    index("expedientes_juzgado_idx").on(t.juzgadoId),
  ],
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
    cambios_realizados: json("cambios_realizados"),
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
export const expedientesRelations = relations(expedientes, ({ many, one }) => ({
  historialAcuerdos: many(acuerdosHistorial),
  usuarioExpedientes: many(usuarioExpedientes),
  juzgado: one(juzgados, {
    fields: [expedientes.juzgadoId],
    references: [juzgados.juzgadoId],
  }),
}));

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

// Relaciones para extractos
export const extractosRelations = relations(extractos, ({ many }) => ({
  juzgados: many(juzgados),
}));

// Relaciones para juzgados
export const juzgadosRelations = relations(juzgados, ({ one, many }) => ({
  extracto: one(extractos, {
    fields: [juzgados.extractoId],
    references: [extractos.extractoId],
  }),
  expedientes: many(expedientes),
}));

// Tipos para las relaciones (opcional pero recomendado)
export type Usuario = typeof usuarios.$inferSelect;
export type Expediente = typeof expedientes.$inferSelect;
export type UsuarioExpedientes = typeof usuarioExpedientes.$inferSelect;
export type UsuarioExpedienteConExpediente = UsuarioExpedientes & {
  expediente: Expediente;
};
export type UsuarioAtributos = typeof usuarioAttributes.$inferInsert;
export type Juzgado = typeof juzgados.$inferSelect;
export type Extracto = typeof extractos.$inferSelect;
