import { Inject, Injectable } from "@nestjs/common";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from "../../database/schema";
import extractos from "./data/extractos";
import { Extractos, Juzgados } from "../types/seed.type";

@Injectable()
export class SeedService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
  ) {}

  async seedDatabase() {
    await this.seedExtractos();
    await this.seedJuzgados();
    await this.database.refreshMaterializedView(schema.listaJuzgados);
    await this.database.refreshMaterializedView(schema.juzgadosFormateados);
    console.log("Database seeded successfully");
  }

  async seedExtractos() {
    console.log("Seeding extractos...");

    const insertData = extractos.map((extracto: Extractos) => ({
      extractoId: extracto.id,
      extracto_value: extracto.id,
      extracto_name: extracto.name,
      key_search: extracto.key_search,
    }));

    await this.database.insert(schema.extractos).values(insertData);
  }

  async seedJuzgados() {
    console.log("Seeding juzgados...");

    const allJuzgados: Juzgados[] = [];

    // Collect all juzgados from each extracto
    extractos.forEach((extracto: Extractos) => {
      extracto.juzgados.forEach((juzgado: Juzgados) => {
        allJuzgados.push({
          ...juzgado,
          extractoId: extracto.id,
        });
      });
    });

    // Insert all juzgados
    const insertData = allJuzgados.map((juzgado: Juzgados) => ({
      juzgadoId: juzgado.id,
      value: juzgado.value,
      name: juzgado.name,
      judge: juzgado.judge,
      extractoId: juzgado.extractoId ?? "",
    }));

    await this.database.insert(schema.juzgados).values(insertData);
  }
}
