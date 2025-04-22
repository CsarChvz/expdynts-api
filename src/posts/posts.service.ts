/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from "../database/schema";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { HttpService } from "@nestjs/axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { lastValueFrom } from "rxjs";
@Injectable()
export class PostsService {
  constructor(
    // @Inject(DATABASE_CONNECTION)
    // private readonly database: NodePgDatabase<typeof schema>,

    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
    private readonly httpService: HttpService,
  ) {}

  async findAll() {
    return await this.database.query.posts.findFirst();
  }

  async checkProxy() {
    const login = "a698053eb4a3eeaabac6";
    const password = "9ce98dafba032b0f";

    const httpsAgent = new HttpsProxyAgent(
      `http://${login}:${password}@gw.dataimpulse.com:823/`,
    );

    // const login = "brd.superproxy.io";
    // const password = "rcauvdgwqk5y";

    // const httpsAgent = new HttpsProxyAgent(
    //   "http://brd-customer-hl_6e97d2e6-zone-datacenter_proxy1:9lhja4a0qr1e@brd.superproxy.io:33335/",
    // );

    const result = await lastValueFrom(
      this.httpService.get("https://geo.brdtest.com/mygeo.json", {
        httpsAgent,
      }),
    );

    console.log(result.data); // Para ver el contenido de la respuesta
    return result.data;
  }
}
