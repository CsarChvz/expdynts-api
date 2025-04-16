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

export const extractos = createTable(
  "extractos",
  (d) => ({
    clave: d.varchar({ length: 50 }).primaryKey(),
    juzgadoId: integer("juzgado_id")
      .notNull()
      .references(() => juzgados.id, { onDelete: "cascade" }),
    nombre_extracto: d.varchar({ length: 120 }).notNull(),
    descripcion: d.text(),
  }),
  (t) => [
    index("extractos_clave_idx").on(t.clave),
    index("extractos_juzgado_idx").on(t.juzgadoId),
  ],
);

// Tablas
export const juzgados = createTable(
  "juzgados",
  {
    id: serial("id").primaryKey(),
    clave_juzgado: varchar("clave_juzgado", { length: 50 }).notNull().unique(),
    nombre_juzgado: varchar("nombre_juzgado", { length: 255 }).notNull(),
    direccion: text("direccion"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("juzgados_clave_idx").on(t.clave_juzgado)],
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
    fecha: date("fecha").notNull(),
    juzgadoId: integer("juzgado_id")
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
    index("expedientes_fecha_idx").on(t.fecha),
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
export const juzgadosRelations = relations(juzgados, ({ many }) => ({
  extractos: many(extractos),
  expedientes: many(expedientes),
}));

// Relaciones para extractos
export const extractosRelations = relations(extractos, ({ one }) => ({
  juzgado: one(juzgados, {
    fields: [extractos.juzgadoId],
    references: [juzgados.id],
  }),
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
      juzgadoNombre: juzgados.nombre_juzgado,
      juzgadoClave: juzgados.clave_juzgado,
    })
    .from(extractos)
    .innerJoin(juzgados, eq(extractos.juzgadoId, juzgados.id)),
);

export const vistaResumenExpedientesPorJuzgado = pgView(
  "vista_resumen_expedientes_por_juzgado",
).as((qb) =>
  qb
    .select({
      juzgadoId: juzgados.id,
      juzgadoNombre: juzgados.nombre_juzgado,
      totalExpedientes: sql`COUNT(${expedientes.id})`.as("total_expedientes"),
    })
    .from(juzgados)
    .innerJoin(expedientes, eq(juzgados.id, expedientes.juzgadoId))
    .groupBy(juzgados.id, juzgados.nombre_juzgado),
);
