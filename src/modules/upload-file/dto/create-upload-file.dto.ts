import { ApiProperty } from '@nestjs/swagger';

export class CreateUploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
