// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
// schema.ts
import { sql, relations, eq } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  varchar,
  timestamp,
  integer,
  json,
  pgEnum,
  uniqueIndex,
  pgView,
  pgMaterializedView,
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
    extracto_name: d.varchar({ length: 120 }).notNull(), // "Zona Metropolitana", "Penales", "Foraneos"
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
    index("expedientes_fecha_juzgado_idx").on(t.fecha, t.juzgadoId), // índice compuesto
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
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
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

// Vistas -- Extracto, Juzgados y Expedientes
// Vista 1: Expedientes completos con información de juzgado y extracto
export const expedientesCompletos = pgView("expedientes_completos").as((qb) => {
  return qb
    .select({
      expedienteId: expedientes.expedienteId,
      numero: expedientes.exp,
      fecha: expedientes.fecha,
      url: expedientes.url,
      createdAt: expedientes.createdAt,
      juzgadoId: juzgados.juzgadoId,
      juzgadoNombre: juzgados.name,
      juzgadoValue: juzgados.value,
      extractoId: extractos.extractoId,
      extractoNombre: extractos.extracto_name,
    })
    .from(expedientes)
    .leftJoin(juzgados, sql`${expedientes.juzgadoId} = ${juzgados.juzgadoId}`)
    .leftJoin(extractos, sql`${juzgados.extractoId} = ${extractos.extractoId}`);
});

// Vista completa para obtener juzgados en formato específico
export const juzgadosFormateados = pgMaterializedView(
  "juzgados_formateados",
).as((qb) => {
  return qb
    .select({
      // Campos seleccionados según el formato requerido
      value: juzgados.value,
      name: juzgados.name,
      judge: juzgados.judge,
      id: juzgados.juzgadoId, // Este es el campo "id" en tu resultado esperado
      key_search: extractos.key_search, // Ahora viene de extractos
      // Campos adicionales que pueden ser útiles
      extractoId: extractos.extractoId,
      extractoNombre: extractos.extracto_name,
    })
    .from(juzgados)
    .leftJoin(extractos, sql`${juzgados.extractoId} = ${extractos.extractoId}`);
});

// Vista simple y directa para obtener los juzgados en el formato requerido
export const listaJuzgados = pgMaterializedView("lista_juzgados").as((qb) => {
  return qb
    .select({
      value: juzgados.value,
      name: juzgados.name,
      judge: juzgados.judge,
      id: juzgados.juzgadoId,
      key_search: extractos.key_search, // Ahora viene de extractos
    })
    .from(juzgados)
    .leftJoin(extractos, sql`${juzgados.extractoId} = ${extractos.extractoId}`);
});

export const juzgadosPorExtracto = pgMaterializedView(
  "juzgados_por_extracto",
).as((qb) => {
  return qb
    .select({
      extractoId: extractos.extractoId,
      extractoNombre: extractos.extracto_name, // NOTA: Es "name", no "extracto_name"
      extractoKeySearch: extractos.key_search,
      juzgados: sql<string>`json_agg(json_build_object(
        'value', ${juzgados.value},
        'name', ${juzgados.name},
        'judge', ${juzgados.judge},
        'id', ${juzgados.juzgadoId},
        'key_search', ${extractos.key_search}
      ) ORDER BY ${juzgados.value})`.as("juzgados"), // <- alias obligatorio
      totalJuzgados: sql<number>`count(${juzgados.juzgadoId})`.as(
        "totalJuzgados",
      ), // <- alias obligatorio
    })
    .from(extractos)
    .leftJoin(juzgados, eq(extractos.extractoId, juzgados.extractoId))
    .groupBy(
      extractos.extractoId,
      extractos.extracto_name,
      extractos.key_search,
    );
});

//Vistas - Expedientes
export const detalleExpedienteConHistorialAcuerdos = pgView(
  "detalle_expediente_con_historial_acuerdos",
).as((qb) => {
  return qb
    .select({
      expedienteId: expedientes.expedienteId,
      numeroExpediente: expedientes.exp,
      fecha: expedientes.fecha,
      url: expedientes.url,
      acuerdosJson: sql`${expedientes.acuerdos_json}::text`.as("acuerdos_json"), // Convertir a texto para solucionar el problema

      juzgadoId: juzgados.juzgadoId,
      juzgadoNombre: juzgados.name,
      juzgadoValue: juzgados.value,
      juzgadoJudge: juzgados.judge,

      extractoId: extractos.extractoId,
      extractoNombre: extractos.extracto_name,
      extractoKeySearch: extractos.key_search,

      usuarioExpedienteId: usuarioExpedientes.usuarioExpedientesId,
      usuarioId: usuarios.usuarioId,
      usuarioEmail: usuarios.email,
      nombreUsuario: usuarioAttributes.nombre_usuario,
      apellidoUsuario: usuarioAttributes.apellido,
      statusUsuarioExpediente: usuarioExpedientes.status,
      fechaAsociacion: usuarioExpedientes.createdAt,
    })
    .from(expedientes)
    .leftJoin(
      usuarioExpedientes,
      eq(expedientes.expedienteId, usuarioExpedientes.expedienteId),
    )
    .leftJoin(usuarios, eq(usuarioExpedientes.usuarioId, usuarios.usuarioId))
    .leftJoin(
      usuarioAttributes,
      eq(usuarios.usuarioId, usuarioAttributes.usuarioAttributeId),
    )
    .leftJoin(juzgados, eq(expedientes.juzgadoId, juzgados.juzgadoId))
    .leftJoin(extractos, eq(juzgados.extractoId, extractos.extractoId));
});

export const historialDeExpedientes = pgView("historial_de_expedientes").as(
  (qb) => {
    return qb
      .select({
        expedienteId: usuarioExpedientes.expedienteId,
        usuarioExpedienteId: usuarioExpedientes.usuarioExpedientesId,
        acuerdosHistorialId: acuerdosHistorial.acuerdosHistorialId,
        fechaHistorial: acuerdosHistorial.createdAt,
        acuerdos: acuerdosHistorial.acuerdos,
        cambiosRealizados: acuerdosHistorial.cambios_realizados,
        hash: acuerdosHistorial.hash,
      })
      .from(acuerdosHistorial)
      .leftJoin(
        usuarioExpedientes,
        eq(
          acuerdosHistorial.usuarioExpedienteId,
          usuarioExpedientes.usuarioExpedientesId,
        ),
      );
  },
);

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
