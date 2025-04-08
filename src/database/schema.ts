import {
  pgTable,
  serial,
  text,
  integer,
  varchar,
  timestamp,
  json,
  boolean,
  pgEnum,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums mejorados manteniendo nombres originales
export const extractoEnum = pgEnum('extracto', [
  'ZM',
  'FRNS',
  'PENALT',
  'POPF',
  'LABORAL',
]);

export const statusEnum = pgEnum('status', ['ACTIVE', 'INACTIVE']);
export const busquedaStatusEnum = pgEnum('busqueda_status', [
  'CHECKED',
  'UNCHECKED',
]);
export const roleEnum = pgEnum('role', ['ADMIN', 'USER', 'MODERATOR']);

// Función reutilizable para timestamps comunes
const addTimestamps = (table) => {
  return {
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  };
};

// Tablas principales
export const usuario = pgTable('usuario', {
  id: serial('id').primaryKey(),

  externalId: varchar('external_id', { length: 255 })
    .default(sql`gen_random_uuid()`)
    .unique(),

  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  hashedRefreshToken: varchar('hashed_refresh_token', { length: 255 }),
  attributes: json('attributes').$type<{
    nombre?: string;
    apellido?: string;
    preferencias?: Record<string, any>;
  }>(),

  phoneNumber: varchar('phone_number', { length: 15 }), // ← No tiene .notNull()

  ...addTimestamps({}),
});

export const expedientes = pgTable(
  'expedientes',
  {
    id: serial('id').primaryKey(),
    exp: integer('exp').notNull(),
    fecha: integer('fecha').notNull(),
    extracto: extractoEnum('extracto').notNull(),
    cveJuz: varchar('cve_juz', { length: 50 }).notNull(),
    acuerdosNuevos: text('acuerdos_nuevos').default(''),
    acuerdosAnteriores: text('acuerdos_anteriores').default(''),
    hashNuevo: varchar('hash_nuevo', { length: 255 }).default(''),
    hashAnterior: varchar('hash_anterior', { length: 255 }).default(''),
    ...addTimestamps({}),
  },
  (table) => {
    return {
      expIdx: uniqueIndex('exp_idx').on(table.exp),
      cveJuzIdx: uniqueIndex('cve_juz_idx').on(table.cveJuz),
    };
  },
);

export const usuarioExpedientes = pgTable(
  'usuario_expedientes',
  {
    id: serial('id').primaryKey(),
    usuarioId: integer('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    expedienteId: integer('expediente_id')
      .notNull()
      .references(() => expedientes.id, { onDelete: 'cascade' }),
    status: statusEnum('status').default('ACTIVE').notNull(),
    ...addTimestamps({}),
  },
  (table) => {
    return {
      usuarioExpIdx: uniqueIndex('usuario_exp_idx').on(
        table.usuarioId,
        table.expedienteId,
      ),
    };
  },
);

export const busquedaCheck = pgTable('busqueda_check', {
  id: serial('id').primaryKey(),
  status: busquedaStatusEnum('status').default('CHECKED').notNull(),
  descripcion: text('descripcion'),
  ultimaEjecucion: timestamp('ultima_ejecucion', { withTimezone: true }),
  ...addTimestamps({}),
});

export const expedientesRelations = relations(expedientes, ({ many }) => ({
  usuarios: many(usuarioExpedientes),
}));

export const usuarioExpedientesRelations = relations(
  usuarioExpedientes,
  ({ one }) => ({
    usuario: one(usuario, {
      fields: [usuarioExpedientes.usuarioId],
      references: [usuario.id],
    }),
    expediente: one(expedientes, {
      fields: [usuarioExpedientes.expedienteId],
      references: [expedientes.id],
    }),
  }),
);
