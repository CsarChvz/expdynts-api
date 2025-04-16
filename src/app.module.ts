import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PostsModule } from "./posts/posts.module";
import { CommonModule } from "./common/common.module";
import { QueueModule } from './module/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PostsModule,
    CommonModule,
    QueueModule,
  ],
})
export class AppModule {}
