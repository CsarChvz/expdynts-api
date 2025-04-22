import { Body, Controller, Post } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Queue")
@Controller("queue")
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post("experiment")
  async addExperimentJob(@Body() data: any) {
    return this.queueService.addExperimentJob(data);
  }

  @Post("notification")
  async addNotificationJob(@Body() data: any) {
    return this.queueService.addNotificationJob(data);
  }
}
