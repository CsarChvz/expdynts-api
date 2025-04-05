import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import fastifyCaching from '@fastify/caching';
import compression from '@fastify/compress';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }), // Habilita logs de Fastify
  );

  await app.register(compression, { 
    encodings: ['gzip', 'br'], 
    threshold: 1024, 
  });

  await app.register(fastifyCaching, {
    privacy: 'public', // Cache público (ej: para CDNs)
    expiresIn: 3600, // TTL de 1 hora
  });


  await app.listen(3000, '0.0.0.0');
  console.log(`Servidor corriendo en http://localhost:3000 con Bun y Fastify 🚀`);
}
bootstrap();