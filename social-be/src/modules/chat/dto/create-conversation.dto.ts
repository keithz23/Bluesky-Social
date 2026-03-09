import { IsArray, IsEnum, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
  @IsEnum(['DIRECT', 'GROUP'])
  type: 'DIRECT' | 'GROUP';

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participantIds: string[];

  @IsOptional()
  @IsString()
  name?: string;
}
