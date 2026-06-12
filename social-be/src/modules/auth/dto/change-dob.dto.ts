import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty } from "class-validator";

export class ChangeDateOfBirthDto {
    @ApiProperty({
        example: '1999-05-15',
    })
    @IsDateString()
    @IsNotEmpty()
    dateOfBirth!: string;
}