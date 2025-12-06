import { IsString } from 'class-validator';

export class ReportCommentDto {
  @IsString()
  reason: string;
}



