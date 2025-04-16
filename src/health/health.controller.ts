// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: DatabaseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Check database connection health' })
  @ApiResponse({
    status: 200,
    description: 'Database is responding normally',
    schema: {
      example: {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      },
    },
  })
  async checkDatabase() {
    return this.health.check([async () => this.db.isHealth('database')]);
  }

  @Get('memory')
  @HealthCheck()
  @ApiOperation({ summary: 'Check system memory health' })
  @ApiResponse({
    status: 200,
    description: 'Memory usage is within normal thresholds',
    schema: {
      example: {
        status: 'ok',
        info: { memory_heap: { status: 'up' } },
        error: {},
        details: { memory_heap: { status: 'up' } },
      },
    },
  })
  async checkMemory() {
    return this.health.check([
      async () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Complete system health check' })
  async checkAll() {
    return this.health.check([
      async () => this.db.isHealth('database'),
      async () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
