import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../sessions/firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }

    const token = authorization.split('Bearer ')[1];

    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      const db = this.firebaseService.getDatabase();
      const userSnapshot = await db
        .ref(`users/${decodedToken.uid}`)
        .once('value');
      const userData = userSnapshot.val();

      if (!userData) {
        throw new UnauthorizedException(
          'Usuário não encontrado no banco de dados',
        );
      }

      request.user = {
        ...decodedToken,
        role: userData.role,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
      };
      return true;
    } catch (error) {
      console.error('Erro ao verificar o token Firebase:', error); // Log detalhado do erro
      throw new UnauthorizedException('Falha na autenticação do token');
    }
  }
}
