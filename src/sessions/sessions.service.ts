import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from './firebase/firebase.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class SessionsService {
  private db: admin.database.Database;

  constructor(private readonly firebaseService: FirebaseService) {
    this.db = this.firebaseService.getDatabase();
  }

  async validateUserRole(userId: string, requiredRole: string): Promise<void> {
    const userSnapshot = await this.db.ref(`users/${userId}`).once('value');
    const userData = userSnapshot.val();

    if (!userData || userData.role !== requiredRole) {
      throw new ForbiddenException(
        `Permissão negada: Apenas usuários com o papel '${requiredRole}' podem executar esta ação.`,
      );
    }
  }

  async generateQRCode(
    sessionId: string,
    sessionCode: string,
  ): Promise<string> {
    // Gera um URL para a sessão
    const sessionURL = `http://localhost:3002/sessions/join/${sessionCode}`;

    // Gera o QR code a partir do URL
    const qrCodeDataURL = await QRCode.toDataURL(sessionURL);

    return qrCodeDataURL; // Retorna o QR code como uma URL base64
  }

  // Gera um código de sessão curto e único
  private async generateUniqueSessionCode(): Promise<string> {
    let isUnique = false;
    let sessionCode = '';

    while (!isUnique) {
      // Gera uma string aleatória de 6 caracteres
      sessionCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Exemplo: 'A3F2B4'

      // Verifica se o código já está em uso
      const snapshot = await this.db
        .ref(`sessions`)
        .orderByChild('sessionCode')
        .equalTo(sessionCode)
        .once('value');
      isUnique = !snapshot.exists();
    }

    return sessionCode;
  }

  async createSession(
    createSessionDto: CreateSessionDto,
    userId: string,
  ): Promise<any> {
    // Verifica se o usuário é um SPEAKER antes de criar uma sessão
    await this.validateUserRole(userId, 'SPEAKER');

    const sessionCode = await this.generateUniqueSessionCode();

    const sessionRef = this.db.ref('sessions').push();
    const sessionId = sessionRef.key;

    const qrcode = await this.generateQRCode(sessionId, sessionCode);

    const sessionData = {
      ...createSessionDto,
      createdAt: Date.now(),
      createdBy: userId,
      sessionCode,
      qrcode,
      attendees: {},
      questions: {},
    };

    await sessionRef.set(sessionData);

    return { sessionId, sessionCode, ...sessionData };
  }

  async joinSession(
    JoinSessionDto: JoinSessionDto,
    userId: string,
  ): Promise<void> {
    const { sessionCode, sessionId } = JoinSessionDto;
    let sessionRef = null;

    // Verifica se a sessão está sendo acessada por ID ou pelo código curto
    if (sessionId) {
      sessionRef = this.db.ref(`sessions/${sessionId}`);
    } else if (sessionCode) {
      sessionRef = this.db
        .ref('sessions')
        .orderByChild('sessionCode')
        .equalTo(sessionCode)
        .limitToFirst(1);
    } else {
      throw new BadRequestException(
        'Session ID ou código da sessão é obrigatório.',
      );
    }

    const sessionSnapshot = await sessionRef.once('value');

    if (!sessionSnapshot.exists()) {
      throw new NotFoundException('Sessão não encontrada');
    }

    // Se `sessionRef` foi obtido usando `orderByChild`, sessionSnapshot.val() retorna um objeto com o ID da sessão como chave.
    const sessionKey = sessionId
      ? sessionId
      : Object.keys(sessionSnapshot.val())[0];

    await this.db.ref(`sessions/${sessionKey}/attendees/${userId}`).set(true);
  }

  async getSession(sessionId: string): Promise<any> {
    const sessionSnapshot = await this.db
      .ref(`sessions/${sessionId}`)
      .once('value');

    if (!sessionSnapshot.exists()) {
      throw new NotFoundException('Sessão não encontrada');
    }

    return sessionSnapshot.val();
  }

  async getSessionAttendees(sessionId: string, userId: string): Promise<any[]> {
    // Verifica se o usuário é o criador da sessão antes de visualizar os participantes
    const session = await this.getSession(sessionId);

    if (session.createdBy !== userId) {
      throw new ForbiddenException(
        'Permissão negada: Apenas o criador da sessão pode visualizar os participantes.',
      );
    }

    const attendeesSnapshot = await this.db
      .ref(`sessions/${sessionId}/attendees`)
      .once('value');
    const attendees = attendeesSnapshot.val() || {};

    const userIds = Object.keys(attendees);

    const usersPromises = userIds.map(async (id) => {
      const userSnapshot = await this.db.ref(`users/${id}`).once('value');
      return { uid: id, ...userSnapshot.val() };
    });

    return Promise.all(usersPromises);
  }

  async createQuestion(
    createQuestionDto: CreateQuestionDto,
    userId: string,
  ): Promise<any> {
    const { sessionId, text } = createQuestionDto;

    const sessionRef = this.db.ref(`sessions/${sessionId}`);
    const sessionSnapshot = await sessionRef.once('value');

    if (!sessionSnapshot.exists()) {
      throw new NotFoundException('Sessão não encontrada');
    }

    const questionRef = sessionRef.child('questions').push();
    const questionId = questionRef.key;

    const questionData = {
      id: questionId,
      createdAt: Date.now(),
      createdBy: userId,
      text,
      votes: {},
    };

    await questionRef.set(questionData);

    return { questionId, ...questionData };
  }

  async getQuestions(sessionId: string): Promise<any[]> {
    const questionsSnapshot = await this.db
      .ref(`sessions/${sessionId}/questions`)
      .once('value');

    const questions = questionsSnapshot.val() || {};

    // Retorna as perguntas como uma lista
    return Object.values(questions);
  }

  async voteQuestion(
    sessionId: string,
    questionId: string,
    userId: string,
  ): Promise<void> {
    const voteRef = this.db.ref(
      `sessions/${sessionId}/questions/${questionId}/votes/${userId}`,
    );
    const voteSnapshot = await voteRef.once('value');

    if (voteSnapshot.exists()) {
      // Se o usuário já votou, remover o voto (toggle)
      await voteRef.remove();
    } else {
      // Adicionar o voto
      await voteRef.set(true);
    }
  }
}
