import { ContentType } from './ValidationUtil';
import { OpenAPIV3, BodySchema } from './types';
export declare class BodySchemaParser {
    parse(path: string, pathSchema: OpenAPIV3.OperationObject, contentType: ContentType): BodySchema;
    private toSchema;
}
