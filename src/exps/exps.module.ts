import { Module } from '@nestjs/common';
import { ExpsService } from './exps.service';
import { ExpsController } from './exps.controller';

@Module({
  controllers: [ExpsController],
  providers: [ExpsService],
})
export class ExpsModule {}
