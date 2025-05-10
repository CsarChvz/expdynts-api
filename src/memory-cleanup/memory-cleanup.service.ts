/* eslint-disable @typescript-eslint/require-await */
// memory-cleanup.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class MemoryCleanupService {
  private readonly logger = new Logger(MemoryCleanupService.name);

  @Cron("*/10 * * * *") // Cada 10 minutos
  async handleMemoryCleanup() {
    // Forzar recolección de basura si está disponible
    if (global.gc) {
      console.log("ESTA DISPONIBLE");
      global.gc();
    }

    const memoryUsage = process.memoryUsage();
    this.logger.log(
      `Limpieza de memoria ejecutada: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB en uso`,
    );
  }
}
