import { RmqOptions, Transport } from '@nestjs/microservices';

export const rabbitmqConfig = {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'sessions_queue',
    queueOptions: {
      durable: true,
    },
    noAck: false,
    persistent: true,
    retryDelay: 3000,
  },
} as RmqOptions;
