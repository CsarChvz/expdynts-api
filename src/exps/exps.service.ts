import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { REDIS_CONFIG } from 'src/common/constants';

@Injectable()
export class ExpsService implements OnModuleDestroy {
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();

  async createQueue(name: string) {
    const queue = new Queue(name, {
      connection: REDIS_CONFIG,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
    this.queues.set(name, queue);
    return queue;
  }

  async addWorker(name: string, processor: (job: any) => Promise<void>) {
    const worker = new Worker(name, processor, {
      connection: REDIS_CONFIG,
      concurrency: 5,
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed: ${err.message}`);
    });

    this.workers.set(name, worker);
  }
  async onModuleDestroy() {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}
