CREATE TYPE "public"."busqueda_status" AS ENUM('CHECKED', 'UNCHECKED');--> statement-breakpoint
CREATE TYPE "public"."extracto" AS ENUM('ZM', 'FRNS', 'PENALT', 'POPF', 'LABORAL');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'USER', 'MODERATOR');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "busqueda_check" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "busqueda_status" DEFAULT 'CHECKED' NOT NULL,
	"descripcion" text,
	"ultima_ejecucion" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expedientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"exp" integer NOT NULL,
	"fecha" integer NOT NULL,
	"extracto" "extracto" NOT NULL,
	"cve_juz" varchar(50) NOT NULL,
	"acuerdos_nuevos" text DEFAULT '',
	"acuerdos_anteriores" text DEFAULT '',
	"hash_nuevo" varchar(255) DEFAULT '',
	"hash_anterior" varchar(255) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(255) DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"hashed_refresh_token" varchar(255),
	"attributes" json,
	"phone_number" varchar(15),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "usuario_external_id_unique" UNIQUE("external_id"),
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuario_expedientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"expediente_id" integer NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuario_expedientes" ADD CONSTRAINT "usuario_expedientes_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_expedientes" ADD CONSTRAINT "usuario_expedientes_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exp_idx" ON "expedientes" USING btree ("exp");--> statement-breakpoint
CREATE UNIQUE INDEX "cve_juz_idx" ON "expedientes" USING btree ("cve_juz");--> statement-breakpoint
CREATE UNIQUE INDEX "usuario_exp_idx" ON "usuario_expedientes" USING btree ("usuario_id","expediente_id");