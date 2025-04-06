import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
  ],
  controllers: [],
})
export class AppModule {}
