import { Test, TestingModule } from '@nestjs/testing';
import { BullShutdownService } from './bull-shutdown.service';

describe('BullShutdownService', () => {
  let service: BullShutdownService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BullShutdownService],
    }).compile();

    service = module.get<BullShutdownService>(BullShutdownService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
