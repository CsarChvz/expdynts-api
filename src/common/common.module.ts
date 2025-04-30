import { Module } from "@nestjs/common";
import { HashModule } from './hash/hash.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [HashModule, SeedModule]
})
export class CommonModule {}
