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
import { RolesGuard } from 'src/common/guards/roles.guards';
import { Role } from 'src/common/decorators/roles.decorator';

@Controller('sessions')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Role('SPEAKER')
  @Post()
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const session = await this.sessionsService.createSession(
      createSessionDto,
      userId,
    );

    return session;
  }

  @Role('SPEAKER', 'ATTENDEE')
  @Post('join')
  async joinSession(@Body() joinSessionDto: JoinSessionDto, @Request() req) {
    const userId = req.user.uid;
    await this.sessionsService.joinSession(joinSessionDto, userId);
    return { message: 'Registrado na sessão com sucesso' };
  }

  @Role('SPEAKER', 'ATTENDEE')
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.sessionsService.getSession(sessionId);
    return session;
  }

  @Role('SPEAKER')
  @Get(':sessionId/attendees')
  async getSessionAttendees(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const attendees = await this.sessionsService.getSessionAttendees(
      sessionId,
      userId,
    );
    return attendees;
  }

  @Role('SPEAKER', 'ATTENDEE')
  @Post('questions')
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req,
  ) {
    const userId = req.user.uid;
    const question = await this.sessionsService.createQuestion(
      createQuestionDto,
      userId,
    );
    return question;
  }

  @Role('SPEAKER', 'ATTENDEE')
  @Get(':sessionId/questions')
  async getQuestions(@Param('sessionId') sessionId: string) {
    const questions = await this.sessionsService.getQuestions(sessionId);
    return questions;
  }

  @Role('SPEAKER', 'ATTENDEE')
  @Post(':sessionId/questions/:questionId/vote')
  async voteQuestion(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @Request() req,
  ) {
    const userId = req.user.uid;
    await this.sessionsService.voteQuestion(sessionId, questionId, userId);
    return { message: 'Voto registrado com sucesso' };
  }
}
