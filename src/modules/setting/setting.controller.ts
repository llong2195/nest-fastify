import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingService } from './setting.service';

@Controller('setting')
export class SettingController {
    constructor(private readonly settingService: SettingService) {}
}
