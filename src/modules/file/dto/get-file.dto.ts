import { ApiProperty } from '@nestjs/swagger';
import { ConvertToBoolean } from '@utils/index';
import { IsBoolean, IsOptional } from 'class-validator';

export class FilterFileDto {
    @ApiProperty({
        default: false,
        required: false,
        description: 'download',
    })
    @IsBoolean()
    @IsOptional()
    @ConvertToBoolean()
    download: boolean;
}
