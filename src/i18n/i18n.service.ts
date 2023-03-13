import { Request } from 'express';
import * as i18n from 'i18n';
import { join } from 'path';

import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DEFAULT_LOCALE } from '@src/configs';

i18n.configure({
    directory: join(__dirname, '../../locales'),
    defaultLocale: DEFAULT_LOCALE,
    updateFiles: false,
});

@Injectable()
export class I18nService {
    constructor(@Inject(REQUEST) private request: Request) {}

    /**
     * It takes a phrase and a language, and returns the translated phrase in the specified language
     * @param {string} phrase - The phrase to translate.
     * @param {string} [lang] - The language to translate to. If not provided, the first language in
     * the request's Accept-Language header will be used.
     * @returns The translated phrase.
     */
    t(phrase: string, lang?: string): string {
        return i18n.__({
            phrase,
            locale: lang ? lang : this.request.acceptsLanguages()[0] || DEFAULT_LOCALE,
        });
    }
}
