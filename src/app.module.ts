import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionsModule } from './sessions/sessions.module';
import { FirebaseService } from './sessions/firebase/firebase.service';
import { SessionsService } from './sessions/sessions.service';
import { SessionsController } from './sessions/sessions.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SessionsModule,
  ],
  controllers: [SessionsController],
  providers: [FirebaseService, SessionsService],
  exports: [FirebaseService],
})
export class AppModule {}
