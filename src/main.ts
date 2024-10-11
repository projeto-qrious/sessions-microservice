import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as dotenv from 'dotenv';
import { rabbitmqConfig } from 'rabbitmq.options';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, rabbitmqConfig);
  await app.listen();
}
bootstrap();
