import { RmqOptions, Transport } from '@nestjs/microservices';

export const rabbitmqConfig = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: 'sessions_queue',
    queueOptions: {
      durable: true,
    },
    noAck: false,
    persistent: true,
    retryDelay: 3000,
  },
} as RmqOptions;
