import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { ConvertToBoolean } from '@utils/index';

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
