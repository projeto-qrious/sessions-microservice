import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { FirebaseService } from './firebase/firebase.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/common/guards/roles.guards';

@Module({
  controllers: [SessionsController],
  providers: [
    SessionsService,
    FirebaseService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class SessionsModule {}
