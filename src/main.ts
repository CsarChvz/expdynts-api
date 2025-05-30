/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import compression from "@fastify/compress";
import fastifyEtag from "@fastify/etag";
import fastifyCors from "@fastify/cors";

import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
const logger = {
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
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
    encodings: ["gzip", "br"],
    threshold: 5120,
  });

  await app.register(fastifyEtag, {
    weak: true,
  });

  const config = new DocumentBuilder()
    .setTitle("Expedientes API")
    .setDescription("Gestión de expedientes")
    .setVersion("1.0")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, documentFactory);
  app.enableShutdownHooks();
  await app.listen(8000, "0.0.0.0");
}
bootstrap();
