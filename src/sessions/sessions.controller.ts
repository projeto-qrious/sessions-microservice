import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/decorators/roles.decorator';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';

@Controller('sessions')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Role('SPEAKER')
  @MessagePattern({ cmd: 'create-session' })
  async createSession(
    @Payload()
    data: {
      createSessionDto: CreateSessionDto;
      userId: string;
      role: string;
    },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    const { createSessionDto, userId, role } = data;

    return await this.sessionsService.createSession(
      createSessionDto,
      userId,
      role,
    );
  }

  @Role('SPEAKER', 'ATTENDEE')
  @MessagePattern({ cmd: 'join-session' })
  async joinSession(
    @Payload()
    data: { joinSessionDto: JoinSessionDto; userId: string; roles: string[] },
    @Ctx() context: RmqContext,
  ) {
    // Confirma a mensagem para RabbitMQ
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    const { joinSessionDto, userId } = data;
    return await this.sessionsService.joinSession(joinSessionDto, userId);
  }

  @Role('SPEAKER', 'ATTENDEE')
  @MessagePattern({ cmd: 'get-session' })
  async getSession(
    @Payload() payload: { sessionId: string },
    @Ctx() context: RmqContext,
  ) {
    // Confirma a mensagem para RabbitMQ
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    const { sessionId } = payload;
    return await this.sessionsService.getSession(sessionId);
  }

  @Role('SPEAKER')
  @MessagePattern({ cmd: 'get-session-attendees' })
  async getSessionAttendees(
    @Payload() payload: { sessionId: string; userId: string },
    @Ctx() context: RmqContext,
  ) {
    // Confirma a mensagem para RabbitMQ
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    const { sessionId, userId } = payload;
    return await this.sessionsService.getSessionAttendees(sessionId, userId);
  }

  @Role('SPEAKER', 'ATTENDEE')
  @MessagePattern({ cmd: 'create-question' })
  async createQuestion(
    @Payload()
    payload: { createQuestionDto: CreateQuestionDto; userId: string },
    @Ctx() context: RmqContext,
  ) {
    // Confirma a mensagem para RabbitMQ
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    const { createQuestionDto, userId } = payload;
    return await this.sessionsService.createQuestion(createQuestionDto, userId);
  }

  @Role('SPEAKER', 'ATTENDEE')
  @MessagePattern({ cmd: 'get-questions' })
  async getQuestions(
    @Payload() payload: { sessionId: string },
    @Ctx() context: RmqContext,
  ) {
    // Confirma a mensagem para RabbitMQ
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    const { sessionId } = payload;
    return await this.sessionsService.getQuestions(sessionId);
  }

  @Role('SPEAKER', 'ATTENDEE')
  @MessagePattern({ cmd: 'vote-question' })
  async voteQuestion(
    @Payload()
    payload: { sessionId: string; questionId: string; userId: string },
    @Ctx() context: RmqContext,
  ) {
    // Confirma a mensagem para RabbitMQ
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    const { sessionId, questionId, userId } = payload;
    await this.sessionsService.voteQuestion(sessionId, questionId, userId);
    return { message: 'Voto registrado com sucesso' };
  }
}
