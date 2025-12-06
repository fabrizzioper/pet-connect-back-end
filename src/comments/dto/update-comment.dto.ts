import { IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @MaxLength(500)
  content: string;
}



