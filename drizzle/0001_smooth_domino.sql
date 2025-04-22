CREATE TABLE "expdynts_acuerdos_historial" (
	"id" serial PRIMARY KEY NOT NULL,
	"expediente_id" integer NOT NULL,
	"acuerdos" json NOT NULL,
	"hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expdynts_acuerdos_historial" ADD CONSTRAINT "expdynts_acuerdos_historial_expediente_id_expdynts_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expdynts_expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acuerdos_historial_expediente_idx" ON "expdynts_acuerdos_historial" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "acuerdos_historial_created_idx" ON "expdynts_acuerdos_historial" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "expdynts_expedientes" DROP COLUMN "acuerdos_nuevos";--> statement-breakpoint
ALTER TABLE "expdynts_expedientes" DROP COLUMN "acuerdos_anteriores";--> statement-breakpoint
ALTER TABLE "expdynts_expedientes" DROP COLUMN "hash_nuevo";--> statement-breakpoint
ALTER TABLE "expdynts_expedientes" DROP COLUMN "hash_anterior";