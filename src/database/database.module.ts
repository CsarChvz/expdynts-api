import { Module } from "@nestjs/common";
import { DATABASE_CONNECTION } from "./database-connection";
import { ConfigService } from "@nestjs/config";
// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Pool } from 'pg';
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) => {
        // const pool = new Pool({
        //   connectionString: configService.getOrThrow('DATABASE_URL'),
        // });

        // return drizzle(pool, {
        //   schema: {
        //     ...schema,
        //   },
        // });
        const sql = neon(configService.getOrThrow("DATABASE_URL"));
        return drizzle({
          client: sql,
          schema: schema,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
