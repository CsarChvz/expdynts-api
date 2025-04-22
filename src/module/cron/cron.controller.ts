import { Controller, Post } from "@nestjs/common";
import { CronService } from "./cron.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Cron")
@Controller("cron")
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Post("bulk")
  async bulkNotifis() {
    return this.cronService.fetchDataAndAddToQueue();
  }
}
