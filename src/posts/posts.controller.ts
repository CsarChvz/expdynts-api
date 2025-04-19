import { Controller, Get } from "@nestjs/common";
import { PostsService } from "./posts.service";

import { ApiTags } from "@nestjs/swagger";

@ApiTags("posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll() {
    return await this.postsService.findAll();
  }

  @Get("proxy")
  async getProxy() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.postsService.checkProxy();
  }
}
