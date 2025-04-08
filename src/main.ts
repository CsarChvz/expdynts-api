import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import fastifyCaching from '@fastify/caching';
import compression from '@fastify/compress';
import fastifyEtag from '@fastify/etag';
import fastifyCors from '@fastify/cors';

const logger = {
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      colorize: true,
    },
  },
};

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: logger }),
  );

  await app.register(fastifyCors);
  await app.register(compression, {
    encodings: ['gzip', 'br'],
    threshold: 5120,
  });

  await app.register(fastifyEtag, {
    weak: true,
  });

  await app.register(fastifyCaching, {
    privacy: 'private',
    expiresIn: 3600,
  });

  await app.listen(8000, '0.0.0.0');
  console.log(
    `Servidor corriendo en http://localhost:3000 con Bun y Fastify 🚀`,
  );
}
bootstrap();