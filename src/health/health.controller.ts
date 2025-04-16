import { Controller, Get } from '@nestjs/common';

import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private databaseHealthIndicator: DatabaseHealthIndicator
  ) {}
  
  @Get('database')
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.databaseHealthIndicator.isHealth('database')
    ]);
  }
}
