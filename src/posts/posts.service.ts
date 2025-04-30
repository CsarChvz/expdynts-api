import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from "../database/schema";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class PostsService {
  constructor(
    // @Inject(DATABASE_CONNECTION)
    // private readonly database: NodePgDatabase<typeof schema>,

    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
    private readonly httpService: HttpService,
  ) {}

  getHistorialAcuerdos() {
    const historial = [];
    return historial;
  }
}
