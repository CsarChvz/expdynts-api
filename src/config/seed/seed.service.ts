import { Inject, Injectable } from "@nestjs/common";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from "../../database/schema";
import extractos from "./data/extractos";
import { Extractos, Juzgados } from "@/common/types/seed.type";

@Injectable()
export class SeedService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
  ) {}

  async seedDatabase() {
    await this.seedExtractos();
    await this.seedJuzgados();

    // Refrescar vistas materializadas
    await this.database.refreshMaterializedView(schema.listaJuzgados);
    await this.database.refreshMaterializedView(schema.juzgadosFormateados);
    await this.database.refreshMaterializedView(schema.extractosConJuzgados);

    console.log("Database seeded successfully");
  }

  async seedExtractos() {
    console.log("Seeding extractos...");

    // Obtener extractoIds ya existentes en la base de datos
    const existing = await this.database
      .select({ extractoId: schema.extractos.extractoId })
      .from(schema.extractos);

    const existingIds = new Set(existing.map((e) => e.extractoId));

    // Filtrar extractos que aún no están
    const insertData = extractos
      .filter((extracto) => !existingIds.has(extracto.id))
      .map((extracto) => ({
        extractoId: extracto.id,
        extracto_value: extracto.id,
        extracto_name: extracto.name,
        key_search: extracto.key_search,
      }));

    if (insertData.length > 0) {
      await this.database.insert(schema.extractos).values(insertData);
      console.log(`Inserted ${insertData.length} new extractos.`);
    } else {
      console.log("No new extractos to insert.");
    }
  }

  async seedJuzgados() {
    console.log("Seeding juzgados...");

    const allJuzgados: Juzgados[] = [];

    // Recolectar todos los juzgados con su extractoId
    extractos.forEach((extracto: Extractos) => {
      extracto.juzgados.forEach((juzgado: Juzgados) => {
        allJuzgados.push({
          ...juzgado,
          extractoId: extracto.id,
        });
      });
    });

    // Obtener juzgadoIds ya existentes
    const existing = await this.database
      .select({ juzgadoId: schema.juzgados.juzgadoId })
      .from(schema.juzgados);

    const existingIds = new Set(existing.map((j) => j.juzgadoId));

    // Filtrar juzgados nuevos
    const insertData = allJuzgados
      .filter((j) => !existingIds.has(j.id))
      .map((juzgado) => ({
        juzgadoId: juzgado.id,
        value: juzgado.value,
        name: juzgado.name,
        judge: juzgado.judge,
        extractoId: juzgado.extractoId ?? "",
      }));

    if (insertData.length > 0) {
      await this.database.insert(schema.juzgados).values(insertData);
      console.log(`Inserted ${insertData.length} new juzgados.`);
    } else {
      console.log("No new juzgados to insert.");
    }
  }
}
