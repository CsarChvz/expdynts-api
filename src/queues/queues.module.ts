import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from 'src/common/constants';
import { QueuesService } from './queues.service';

@Module({
    imports: [
        BullModule.registerQueue({
          name: QUEUE_NAMES.EXP_PROCESSING,
        }),
      ],
    providers: [QueuesService],
})
export class QueuesModule {}
