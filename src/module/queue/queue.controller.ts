import { Body, Controller, Get, Post } from "@nestjs/common";
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
  @Post("bulk-experiments")
  async addBulkExperiments(@Body() body?: { count?: number }) {
    const count = body?.count ?? 10;
    const jobs: any[] = [];

    for (let i = 0; i < count; i++) {
      const job = await this.queueService.addExperimentJob({
        expId: `exp-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
      });
      jobs.push(job);
    }

    return { added: jobs.length, jobs };
  }

  @Post("bulk-notifications")
  async addBulkNotifications(@Body() body?: { count?: number }) {
    const count = body?.count ?? 10;
    const jobs: any[] = [];
    for (let i = 0; i < count; i++) {
      const job = await this.queueService.addNotificationJob({
        notificationId: `notif-${Date.now()}-${i}`,
        recipient: `user-${i}@example.com`,
        timestamp: new Date().toISOString(),
      });
      jobs.push(job);
    }
    return { added: jobs.length, jobs };
  }

  @Get("status")
  async getStatus() {
    const [exps, notifications] = await Promise.all([
      this.queueService.getExpsQueueStatus(),
      this.queueService.getNotificationsQueueStatus(),
    ]);

    return {
      exps,
      notifications,
    };
  }
}
