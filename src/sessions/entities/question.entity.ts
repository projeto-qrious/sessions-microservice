export class Question {
  id: string;
  createdAt: number;
  createdBy: string;
  text: string;
  votes: { [key: string]: boolean };
}
