export class Session {
  id: string;
  createdAt: number;
  createdBy: string;
  title: string;
  description?: string;
  attendees: { [key: string]: boolean };
  questions: { [key: string]: any };
}
