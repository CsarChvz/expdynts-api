import { Module } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { DatabaseModule } from "src/database/database.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
