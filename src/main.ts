/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import fastifyCaching from "@fastify/caching";
import compression from "@fastify/compress";
import fastifyEtag from "@fastify/etag";
import fastifyCors from "@fastify/cors";

import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      // opcional: también puedes forzar cierre aquí a nivel de Fastify
      forceCloseConnections: true, // destruye conexiones HTTP al close :contentReference[oaicite:3]{index=3}
      keepAliveTimeout: 0, // cierra sockets keep‑alive inmediatamente :contentReference[oaicite:4]{index=4}
      logger: {
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
            colorize: true,
          },
        },
      },
    }),
    {
      forceCloseConnections: true, // destruye conexiones HTTP al shutdown :contentReference[oaicite:5]{index=5}
    },
  );

  // registra hooks para los lifecycle events de shutdown
  app.enableShutdownHooks(); // habilita onModuleDestroy/onApplicationShutdown :contentReference[oaicite:6]{index=6}

  // registro de tus plugins Fastify
  await app.register(fastifyCors);
  await app.register(compression, {
    encodings: ["gzip", "br"],
    threshold: 5120,
  });
  await app.register(fastifyEtag, { weak: true });
  await app.register(fastifyCaching, { privacy: "private", expiresIn: 3600 });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Expedientes API")
    .setDescription("Gestión de expedientes")
    .setVersion("1.0")
    .build();
  SwaggerModule.setup("docs", app, () =>
    SwaggerModule.createDocument(app, config),
  );

  await app.listen(8000, "0.0.0.0");
}
bootstrap();
