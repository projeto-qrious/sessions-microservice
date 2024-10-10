import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(500)
  description?: string;
}
