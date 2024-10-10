import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
const serviceAccount = require('../../../firebaseadmin.json');

@Injectable()
export class FirebaseService {
  private app: admin.app.App;

  constructor() {
    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
        databaseURL: 'https://qrious-51310-default-rtdb.firebaseio.com/',
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
