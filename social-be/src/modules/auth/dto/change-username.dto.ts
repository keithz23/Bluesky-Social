import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ChangeUsernameDto {
    @ApiProperty()
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/)
    username!: string;
}