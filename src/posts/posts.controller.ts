import { Controller, Get } from "@nestjs/common";
import { PostsService } from "./posts.service";

import { ApiTags } from "@nestjs/swagger";

@ApiTags("posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get("historial")
  historial() {
    return this.postsService.getHistorialAcuerdos();
  }
}
