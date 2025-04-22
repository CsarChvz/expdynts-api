import { Module } from "@nestjs/common";
import { HashModule } from './hash/hash.module';

@Module({
  imports: [HashModule]
})
export class CommonModule {}
