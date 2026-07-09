import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class Enabled2FADto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    otp!: string
}