import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostsModule } from './posts/posts.module';
import { QueuesModule } from './queues/queues.module';
import { TasksModule } from './tasks/tasks.module';
import { CommonModule } from './common/common.module';
import { BullModule } from '@nestjs/bullmq';
import { ExpsModule } from './exps/exps.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PostsModule,
    QueuesModule,
    TasksModule,
    CommonModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    ExpsModule,
  ],
})
export class AppModule {}
