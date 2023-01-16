import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as i18n from 'i18n';
import { join } from 'path';
import { DEFAULT_LOCALE } from '@src/config';

export enum LOCALES {
    EN = 'en',
    VI = 'vi',
}

@Injectable()
export class I18nService {
    constructor(@Inject(REQUEST) private request: Request) {
        i18n.configure({
            directory: join(__dirname, '../../i18n/locales'),
            updateFiles: false,
            defaultLocale: DEFAULT_LOCALE,
        });
    }

    t(phrase: string): string {
        return i18n.__({
            phrase,
            locale: this.request.acceptsLanguages()[0] || DEFAULT_LOCALE,
        });
    }
}
