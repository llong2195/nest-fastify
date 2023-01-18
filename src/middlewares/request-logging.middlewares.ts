import morgan from 'morgan';

import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

export function useRequestLogging(app: NestExpressApplication, minTime = 150): void {
    const logger = new Logger('Request');
    app.use(
        morgan('dev', {
            stream: {
                write: message => {
                    const mes = message.split(' ');
                    const httpCode = mes.length - 5 > 0 ? parseInt(mes[mes.length - 5]) : 0;
                    const time = mes.length - 2 > 0 ? parseFloat(mes[mes.length - 2]) : 0;
                    if (time > minTime) {
                        switch (true) {
                            case httpCode > 400:
                                logger.error(message.replace('\n', ''));
                                break;
                            default:
                                logger.log(message.replace('\n', ''));
                        }
                    }
                },
            },
        }),
    );
}
