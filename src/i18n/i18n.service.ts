import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as i18n from 'i18n';
import { join } from 'path';
import { DEFAULT_LOCALE } from '@src/configs';

export enum LOCALES {
    EN = 'en',
    VI = 'vi',
}

@Injectable()
export class I18nService {
    constructor(@Inject(REQUEST) private request: Request) {
        i18n.configure({
            directory: join(__dirname, '../../locales'),
            defaultLocale: DEFAULT_LOCALE,
            updateFiles: false,
        });
    }

    t(phrase: string, lang?: string): string {
        return i18n.__({
            phrase,
            locale: lang ? lang : this.request.acceptsLanguages()[0] || DEFAULT_LOCALE,
        });
    }
}
