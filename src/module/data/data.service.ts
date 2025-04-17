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

    // Simulamos entre 1 y 12 elementos cada vez
    const itemCount = Math.floor(Math.random() * 12) + 1;
    const items: any[] = [];

    for (let i = 0; i < itemCount; i++) {
      const type = Math.random() > 0.5 ? "document_review" : "data_analysis";
      const status = Math.random() > 0.7 ? "urgent" : "normal";

      items.push({
        id: uuidv4(),
        title: `${type === "document_review" ? "Revisión de documento" : "Análisis de datos"} #${i + 1}`,
        description:
          type === "document_review"
            ? "Revisión pendiente de informe técnico."
            : "Análisis de métricas de rendimiento en curso.",
        createdAt: new Date(
          new Date().getTime() - Math.floor(Math.random() * 10000000),
        ), // fechas aleatorias pasadas
        priority: status,
        assignedTo: ["Ana", "Carlos", "María", "Luis", "Sofía"][
          Math.floor(Math.random() * 5)
        ],
        data: {
          value: Math.floor(Math.random() * 1000) + 100,
          type,
          metadata: {
            source: "mock-db",
            tags:
              type === "document_review"
                ? ["PDF", "legal"]
                : ["metrics", "performance"],
            timestamp: Date.now(),
          },
        },
      });
    }

    this.logger.debug(`Generados ${items.length} elementos de prueba`);
    return items;
  }
}
