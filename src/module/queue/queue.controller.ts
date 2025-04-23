import { Controller, Post } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Queue")
@Controller("queue")
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post("phone")
  async phoneSend() {
    await this.queueService.sendNotification("api/sendText", {
      phone: "5213314825663",
      text: "Esto es prueba",
    });
  }
}
