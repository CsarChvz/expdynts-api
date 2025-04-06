import { Module } from '@nestjs/common';
import { DATABASE_CONNECTION } from './database-connection';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';


@Module({
    providers: [
      {
        provide: DATABASE_CONNECTION,
        useFactory: (configService: ConfigService) => {
            const sqlite = new Database('sqlite.db');
            return drizzle(sqlite,
                {
                    schema: {
                        
                    }
                }
            );
        },
        inject: [ConfigService],
      },
    ],
    exports: [DATABASE_CONNECTION],
  })
  export class DatabaseModule {}