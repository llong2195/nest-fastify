import * as bodyParser from 'body-parser';
import { NextFunction, Request, Response } from 'express';

import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
    /**
     * It parses the body of the request as JSON.
     * @param {Request} req - Request - The incoming request object
     * @param {Response} res - The response object
     * @param {NextFunction} next - The next function in the middleware chain.
     */
    use(req: Request, res: Response, next: NextFunction) {
        bodyParser.json()(req, res, next);
    }
}
