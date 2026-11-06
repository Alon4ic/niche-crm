import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();

        const send = (statusCode: number, error: string, message: string) =>
            response.status(statusCode).json({statusCode, error, message });

        switch(exception.code) {
            case 'P2002': {
                this.logger.warn(`Unique constraint violated: ${JSON.stringify(exception.meta?.target)}`);
                send(HttpStatus.CONFLICT, 'Conflict', 'A record with the same qnique value already exists');
                return; 
            }
            case 'P2003': {
                this.logger.warn(`Foreign key containt violated: ${JSON.stringify(exception.meta)}`);
                send(HttpStatus.CONFLICT, 'Conflict', 'This record is referenced by other data');
                return; 
            }
            case 'P2025': {
                send(HttpStatus.NOT_FOUND, 'Not Found', 'Record not found');
                return; 
            }
            default: {
                this.logger.error(`Unhandled Prisma error ${exception.code}: ${exception.message}`, exception.stack);
                send(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', 'Internal server error');
            }
        }
    }
}