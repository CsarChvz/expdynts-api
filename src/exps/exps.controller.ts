import { Controller } from '@nestjs/common';
import { ExpsService } from './exps.service';

@Controller('exps')
export class ExpsController {
  constructor(private readonly expsService: ExpsService) {}
}
