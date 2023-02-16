import { Global, Module } from '@nestjs/common';

import { I18nService } from './i18n.service';

@Global()
@Module({
    providers: [
        {
            provide: 'I18N_SERVICE',
            useFactory: () => I18nService,
        },
    ],
    exports: [
        {
            provide: 'I18N_SERVICE',
            useFactory: () => I18nService,
        },
    ],
})
export class I18nModule {}
