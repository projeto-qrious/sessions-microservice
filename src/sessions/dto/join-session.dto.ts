import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinSessionDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  sessionCode?: string;
}
