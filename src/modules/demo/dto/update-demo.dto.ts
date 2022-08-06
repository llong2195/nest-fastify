import { PartialType } from '@nestjs/mapped-types';
import { CreateDemoDto } from './create-demo.dto';

export class UpdateDemoDto extends PartialType(CreateDemoDto) {}
