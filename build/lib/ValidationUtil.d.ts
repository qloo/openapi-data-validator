import { ErrorObject } from 'ajv';
import { OpenAPIV3, OpenApiRequest, ValidationErrorItem } from './types';
export declare class ContentType {
    readonly contentType?: string;
    readonly mediaType: string;
    readonly charSet: string;
    readonly withoutBoundary: string;
    readonly isWildCard?: boolean;
    private constructor();
    static fromString(contentType: string): ContentType;
    static from(req: OpenApiRequest): ContentType;
    equivalents(): string[];
}
export declare function augmentAjvErrors(errors: ErrorObject[] | undefined, data: any): ErrorObject[];
export declare function ajvErrorsToValidatorError(errors: ErrorObject[], customErrorFn?: (e: ErrorObject) => string): ValidationErrorItem[];
export declare function processFormStyleArrays(data: any, parameters?: OpenAPIV3.ParameterObject[]): any;
