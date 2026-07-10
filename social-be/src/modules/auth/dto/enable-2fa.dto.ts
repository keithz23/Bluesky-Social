import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class Enable2FADto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    otp!: string
}