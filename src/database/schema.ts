/* eslint-disable no-empty-pattern */
// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
// schema.ts
import { eq, sql, relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
  json,
  pgEnum,
  uniqueIndex,
  pgView,
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

// Tabla de extractos con clave como ID primario
export const extractos = createTable(
  "extractos",
  (d) => ({
    clave: d.varchar({ length: 50 }).primaryKey(), // Clave como ID primario
    nombre_extracto: d.varchar({ length: 120 }).notNull(),
    descripcion: d.text(),
    key_search: varchar("key_search", { length: 100 }), // Ej: "forean"
  }),
  (t) => [index("extractos_clave_idx").on(t.clave)],
);

// Tabla de juzgados con ID compuesto
export const juzgados = createTable(
  "juzgados",
  {
    id: varchar("id", { length: 50 }).primaryKey(), // ID compuesto como string (e.j. "LABORAL-L04")
    clave_juzgado: varchar("clave_juzgado", { length: 50 }).notNull(), // Ej: "L04"
    nombre_juzgado: varchar("nombre_juzgado", { length: 255 }).notNull(), // Ej: "JUZGADO SEGUNDO LABORAL DE LA PRIMERA REGION"
    tipo_juez: varchar("tipo_juez", { length: 100 }).notNull(), // Ej: "LABORAL"
    extractoClave: varchar("extracto_clave", { length: 50 })
      .notNull()
      .references(() => extractos.clave, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("juzgados_clave_idx").on(t.clave_juzgado),
    index("juzgados_tipo_juez_idx").on(t.tipo_juez),
    index("juzgados_extracto_idx").on(t.extractoClave),
  ],
);

export const usuarios = createTable(
  "usuarios",
  {
    id: serial("id").primaryKey(),
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
    usuarioId: integer("usuario_id")
      .primaryKey()
      .references(() => usuarios.id, { onDelete: "cascade" }),
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

export const expedientes = createTable(
  "expedientes",
  {
    id: serial("id").primaryKey(),
    exp: integer("exp").notNull(),
    año: date("fecha").notNull(),
    juzgadoId: varchar("juzgado_id", { length: 50 })
      .notNull()
      .references(() => juzgados.id, { onDelete: "cascade" }),
    acuerdosNuevos: text("acuerdos_nuevos").default(""),
    acuerdosAnteriores: text("acuerdos_anteriores").default(""),
    hashNuevo: varchar("hash_nuevo", { length: 255 }).default(""),
    hashAnterior: varchar("hash_anterior", { length: 255 }).default(""),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("expedientes_juzgado_idx").on(t.juzgadoId),
    index("expedientes_año_idx").on(t.año),
    uniqueIndex("expedientes_exp_juzgado_unq").on(t.exp, t.juzgadoId),
  ],
);

export const usuarioExpedientes = createTable(
  "usuario_expedientes",
  {
    id: serial("id").primaryKey(),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    expedienteId: integer("expediente_id")
      .notNull()
      .references(() => expedientes.id, { onDelete: "cascade" }),
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
    id: serial("id").primaryKey(),
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
    fields: [usuarios.id],
    references: [usuarioAttributes.usuarioId],
  }),
  expedientes: many(usuarioExpedientes),
}));

// Relaciones para usuarioAttributes
export const usuarioAttributesRelations = relations(
  usuarioAttributes,
  ({ one }) => ({
    usuario: one(usuarios, {
      fields: [usuarioAttributes.usuarioId],
      references: [usuarios.id],
    }),
  }),
);

// Relaciones para juzgados
export const juzgadosRelations = relations(juzgados, ({ one, many }) => ({
  extracto: one(extractos, {
    fields: [juzgados.extractoClave],
    references: [extractos.clave],
  }),
  expedientes: many(expedientes),
}));

// Relaciones para extractos
export const extractosRelations = relations(extractos, ({ many }) => ({
  juzgados: many(juzgados),
}));

// Relaciones para expedientes
export const expedientesRelations = relations(expedientes, ({ one, many }) => ({
  juzgado: one(juzgados, {
    fields: [expedientes.juzgadoId],
    references: [juzgados.id],
  }),
  usuarioExpedientes: many(usuarioExpedientes),
}));

// Relaciones para usuarioExpedientes
export const usuarioExpedientesRelations = relations(
  usuarioExpedientes,
  ({ one }) => ({
    usuario: one(usuarios, {
      fields: [usuarioExpedientes.usuarioId],
      references: [usuarios.id],
    }),
    expediente: one(expedientes, {
      fields: [usuarioExpedientes.expedienteId],
      references: [expedientes.id],
    }),
  }),
);

// Relaciones para busquedaCheck (si tiene relaciones)
export const busquedaCheckRelations = relations(busquedaCheck, ({}) => ({}));

// Tipos para las relaciones (opcional pero recomendado)
export type Juzgado = typeof juzgados.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Expediente = typeof expedientes.$inferSelect;

export const vistaExtractosConJuzgado = pgView(
  "vista_extractos_con_juzgado",
).as((qb) =>
  qb
    .select({
      extractoClave: extractos.clave,
      extractoNombre: extractos.nombre_extracto,
      juzgadoId: juzgados.id,
      juzgadoNombre: juzgados.nombre_juzgado,
      juzgadoClave: juzgados.clave_juzgado,
      tipoJuez: juzgados.tipo_juez,
    })
    .from(extractos)
    .innerJoin(juzgados, eq(juzgados.extractoClave, extractos.clave)),
);

export const vistaResumenExpedientesPorJuzgado = pgView(
  "vista_resumen_expedientes_por_juzgado",
).as((qb) =>
  qb
    .select({
      juzgadoId: juzgados.id,
      juzgadoNombre: juzgados.nombre_juzgado,
      tipoJuez: juzgados.tipo_juez,
      totalExpedientes: sql`COUNT(${expedientes.id})`.as("total_expedientes"),
    })
    .from(juzgados)
    .innerJoin(expedientes, eq(juzgados.id, expedientes.juzgadoId))
    .groupBy(juzgados.id, juzgados.nombre_juzgado, juzgados.tipo_juez),
);
