import { Controller, Get, Header, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { generateQR } from '@utils/util';
import { QRCodeDto } from './dto/create-qr-code.dto';

@ApiTags('v1/qr-code')
@Controller('v1/qr-code')
export class QrCodeController {
    @Get()
    @Header('Content-Type', 'image/png')
    async getQRCode(@Query() param: QRCodeDto, @Res({ passthrough: true }) res: Response) {
        const qr = await generateQR(param.text, param.size);
        return new StreamableFile(qr);
    }
}
