import { Controller, Get, Post } from "@nestjs/common";
import { CronService } from "./cron.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("cron")
@Controller("cron")
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Get("status")
  @ApiOperation({ summary: "Obtiene el estado actual del servicio cron" })
  @ApiResponse({
    status: 200,
    description: "Estado del servicio cron",
    schema: {
      properties: {
        enabled: { type: "boolean" },
      },
    },
  })
  getCronStatus() {
    // Agregamos método para obtener el estado actual
    return { enabled: this.cronService.getIsEnabled() };
  }

  @Post("execute")
  @ApiOperation({ summary: "Ejecuta manualmente el proceso de cron" })
  @ApiResponse({
    status: 200,
    description: "Ejecución completada",
    schema: {
      properties: {
        success: { type: "boolean" },
        processed: {
          type: "number",
          description: "Número de elementos procesados",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Ejecución fallida o servicio deshabilitado",
    schema: {
      properties: {
        success: { type: "boolean" },
        reason: { type: "string", description: "Razón del fallo" },
        error: { type: "string", description: "Mensaje de error" },
      },
    },
  })
  triggerManualExecution() {
    return this.cronService.triggerManualExecution();
  }
}
