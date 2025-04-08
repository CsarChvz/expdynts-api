import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'argon2';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase<typeof schema>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...user } = createUserDto;
    const hashedPassword = await hash(password);
    
    return await this.database.insert(schema.usuario)
      .values({
        email: user.email,
        password: hashedPassword,
      })
      .execute();
  }

  async findByEmail(email: string) {
    return await this.database.query.usuario.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });
  }

  async findOne(userId: number) {
    return await this.database.query.usuario.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });
  }

  async updateHashedRefreshToken(userId: number, hashedRT: string | null) {
    return await this.database.update(schema.usuario)
      .set({ 
        hashedRefreshToken: hashedRT 
      })
      .where(eq(schema.usuario.id, userId))
      .execute();
  }
}