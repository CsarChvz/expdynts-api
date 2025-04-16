// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './database.health';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [TerminusModule, DatabaseModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator],
})
export class HealthModule {}