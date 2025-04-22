import { Controller } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Queue")
@Controller("queue")
export class QueueController {
  constructor(private readonly queueService: QueueService) {}
}
