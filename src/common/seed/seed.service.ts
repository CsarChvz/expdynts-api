import { Inject, Injectable } from "@nestjs/common";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from "../../database/schema";
import extractos from "./data/extractos";

@Injectable()
export class SeedService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
  ) {}
  seedExtractos() {
    console.log(extractos);
  }
}
