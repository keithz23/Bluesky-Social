import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class DeactivateAccountDto {
    @ApiProperty()
    @IsString()
    otp!: string;
}