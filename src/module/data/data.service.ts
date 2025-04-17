/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  /**
   * Simula la obtención de datos de una base de datos
   */
  async fetchPendingItems(): Promise<any[]> {
    this.logger.log("Obteniendo elementos pendientes de la base de datos");

    // Simulamos entre 1 y 5 elementos cada vez
    const itemCount = Math.floor(Math.random() * 12) + 1;
    const items: any[] = [];

    for (let i = 0; i < itemCount; i++) {
      items.push({
        id: uuidv4(),
        title: `Item ${i + 1}`,
        createdAt: new Date(),
        data: {
          value: Math.floor(Math.random() * 100),
          type: Math.random() > 0.5 ? "type1" : "type2",
          metadata: {
            source: "database",
            timestamp: Date.now(),
          },
        },
      });
    }

    this.logger.debug(`Generados ${items.length} elementos de prueba`);
    return items;
  }
}
