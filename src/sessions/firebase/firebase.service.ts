import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private app: admin.app.App;

  constructor() {
    if (!admin.apps.length) {
      // Step 1: Read the environment variable
      const base64Config = process.env.FIREBASE_CONFIG_BASE64;
      if (!base64Config) {
        throw new Error('Missing FIREBASE_CONFIG_BASE64 environment variable');
      }

      // Step 2: Decode from Base64
      const decodedConfig = Buffer.from(base64Config, 'base64').toString(
        'utf-8',
      );

      // Step 3: Parse JSON
      const serviceAccount = JSON.parse(decodedConfig);

      // Step 4: Initialize Firebase Admin SDK
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } else {
      this.app = admin.app();
    }
  }

  getAuth(): admin.auth.Auth {
    return this.app.auth();
  }

  getDatabase(): admin.database.Database {
    return this.app.database();
  }

  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return await this.getAuth().verifyIdToken(idToken);
  }
}
