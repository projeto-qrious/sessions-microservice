import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionsModule } from './sessions/sessions.module';
import { FirebaseService } from './sessions/firebase/firebase.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SessionsModule,
  ],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class AppModule {}
