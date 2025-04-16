import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { DATABASE_CONNECTION } from 'src/database/database-connection';
import * as schema from '../database/schema'
import { NeonHttpDatabase, } from "drizzle-orm/neon-http";
import { NodePgDatabase } from 'drizzle-orm/node-postgres';


@Injectable()
export class PostsService {

  constructor(
    // @Inject(DATABASE_CONNECTION)
    // private readonly database: NodePgDatabase<typeof schema>,


    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>
  ) {}

  create(createPostDto: CreatePostDto) {
    return 'This action adds a new post';
  }

  async findAll() {
    return await this.database.query.posts.findFirst()
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
