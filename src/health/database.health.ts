import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';


import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DATABASE_CONNECTION } from 'src/database/database-connection';
import * as schema from '../database/schema';
import { sql } from 'drizzle-orm';
import { ApiTags } from '@nestjs/swagger';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
  ) {}


  async isHealth(key:string): Promise<HealthIndicatorResult>{
    const indicator = this.healthIndicatorService.check(key);
    try{
        await this.database.execute(sql`SELECT 1`)
        return indicator.up({
            "message": "Database up!"
        })
    } catch (error){
        return indicator.down({
            "message": "Database not able to connect"
        })
    }
  }
}
