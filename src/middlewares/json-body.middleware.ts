import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
    /**
     * It's a function that takes a request, a response, and a next function, and it calls the
     * bodyParser.json() function with those three parameters
     * @param {Request} req - Request - The incoming request object
     * @param {Response} res - The response object
     * @param next - The next function in the middleware chain.
     */
    use(req: Request, res: Response, next: () => any) {
        bodyParser.json()(req, res, next);
    }
}
