import { IsString } from 'class-validator';

export class ErrorResponse {
  @IsString()
  message: string;

  @IsString()
  code: string;
}
