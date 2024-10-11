import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseService } from '../../sessions/firebase/firebase.service';

@Injectable()
export class RolesGuard extends FirebaseAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    firebaseService: FirebaseService,
  ) {
    super(firebaseService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles especificados na rota, permite o acesso
    if (!requiredRoles) {
      return true;
    }

    let user;

    if (context.getType() === 'rpc') {
      // Para contexto RPC, obtém o usuário do data
      const data = context.switchToRpc().getData();
      user = data.user;
    } else {
      // Para contexto HTTP, obtém o usuário do request
      const request = context.switchToHttp().getRequest();
      user = request.user;
    }

    if (!user) {
      throw new ForbiddenException('Acesso negado: Usuário não autenticado.');
    }

    // Verifica se o usuário possui um dos papéis necessários
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso negado: Permissão insuficiente.');
    }

    return true;
  }
}
