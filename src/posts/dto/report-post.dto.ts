import { IsString } from 'class-validator';

export class ReportPostDto {
  @IsString()
  reason: string;
}

