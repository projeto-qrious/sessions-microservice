import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../sessions/firebase/firebase.service';
import { RmqContext } from '@nestjs/microservices';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  protected firebaseService: FirebaseService;

  constructor(firebaseService: FirebaseService) {
    this.firebaseService = firebaseService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      // Tratamento para contexto HTTP
      return this.canActivateHttp(context);
    } else if (context.getType() === 'rpc') {
      // Tratamento para contexto RPC (RabbitMQ)
      return this.canActivateRpc(context);
    }
    return false;
  }

  // Método de validação para requisições HTTP
  private async canActivateHttp(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }

    const token = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      const db = this.firebaseService.getDatabase();
      const userSnapshot = await db
        .ref(`users/${decodedToken.uid}`)
        .once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      request.user = {
        ...decodedToken,
        role: userData.role,
        email: userData.email,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Falha na autenticação do token');
    }
  }

  // Método de validação para mensagens RPC (RabbitMQ)
  private async canActivateRpc(context: ExecutionContext): Promise<boolean> {
    const rpcContext = context.switchToRpc().getContext<RmqContext>();
    const message = rpcContext.getMessage();

    const content = JSON.parse(message.content.toString());
    const token = content?.data.token; // Supondo que o token é enviado no payload das mensagens

    if (!token) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }

    try {
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      const db = this.firebaseService.getDatabase();
      const userSnapshot = await db
        .ref(`users/${decodedToken.uid}`)
        .once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      context.switchToRpc().getData().user = {
        ...decodedToken,
        role: userData.role,
        email: userData.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Falha na autenticação do token');
    }
  }
}
