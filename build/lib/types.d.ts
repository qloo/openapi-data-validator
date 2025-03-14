import { Options as AjvOptions, ErrorObject } from 'ajv';
export type BodySchema = OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | BodyWithFormat;
export type BodyWithFormat = {
    format?: string;
};
export interface ParametersSchema {
    query: object;
    headers: object;
    path: object;
    cookies: object;
}
export interface ValidationSchema extends ParametersSchema {
    body: BodySchema;
}
export interface Options extends AjvOptions {
    serDesMap?: SerDesMap;
}
export interface RequestValidatorOptions extends Options, ValidateRequestOpts {
}
export type ValidateRequestOpts = {
    allowUnknownQueryParameters?: boolean;
    removeAdditional?: boolean | 'all' | 'failing';
};
export type Format = {
    name: string;
    type?: 'number' | 'string';
    validate: (v: any) => boolean;
};
export type SerDes<T> = {
    format: string;
    serialize?: (o: T) => string;
    deserialize?: (s: string) => unknown;
};
export declare class SerDesSingleton<T> implements SerDes<T> {
    serializer: SerDes<T>;
    deserializer: SerDes<T>;
    format: string;
    serialize?: (o: T) => string;
    deserialize?: (s: string) => T;
    constructor(param: {
        format: string;
        serialize: (o: T) => string;
        deserialize: (s: string) => T;
    });
}
export type SerDesMap = {
    [format: string]: SerDes<any>;
};
export interface OpenApiValidatorOpts {
    apiSpec: OpenAPIV3.Document | string;
    customErrorFn?: (e: ErrorObject) => string;
    compiledFilePath?: string;
    validateRequests?: boolean | ValidateRequestOpts;
    serDes?: SerDes<any>[];
    formats?: Format[];
    removeAdditional?: true | false | 'all' | undefined;
}
export declare namespace OpenAPIV3 {
    export interface Document {
        openapi: string;
        info?: InfoObject;
        servers?: ServerObject[];
        paths: PathsObject;
        components?: ComponentsObject;
        security?: SecurityRequirementObject[];
        tags?: TagObject[];
        externalDocs?: ExternalDocumentationObject;
    }
    export interface InfoObject {
        title: string;
        description?: string;
        termsOfService?: string;
        contact?: ContactObject;
        license?: LicenseObject;
        version: string;
    }
    export interface ContactObject {
        name?: string;
        url?: string;
        email?: string;
    }
    export interface LicenseObject {
        name: string;
        url?: string;
    }
    export interface ServerObject {
        url: string;
        description?: string;
        variables?: {
            [variable: string]: ServerVariableObject;
        };
    }
    export interface ServerVariableObject {
        enum?: string[];
        default: string;
        description?: string;
    }
    export interface PathsObject {
        [pattern: string]: PathItemObject;
    }
    export interface PathItemObject {
        $ref?: string;
        summary?: string;
        description?: string;
        get?: OperationObject;
        put?: OperationObject;
        post?: OperationObject;
        delete?: OperationObject;
        options?: OperationObject;
        head?: OperationObject;
        patch?: OperationObject;
        trace?: OperationObject;
        servers?: ServerObject[];
        parameters?: Array<ReferenceObject | ParameterObject>;
    }
    export interface OperationObject {
        tags?: string[];
        summary?: string;
        description?: string;
        externalDocs?: ExternalDocumentationObject;
        operationId?: string;
        parameters?: Array<ReferenceObject | ParameterObject>;
        requestBody?: ReferenceObject | RequestBodyObject;
        responses?: ResponsesObject;
        callbacks?: {
            [callback: string]: ReferenceObject | CallbackObject;
        };
        deprecated?: boolean;
        security?: SecurityRequirementObject[];
        servers?: ServerObject[];
    }
    export interface ExternalDocumentationObject {
        description?: string;
        url: string;
    }
    export interface ParameterObject extends ParameterBaseObject {
        name: string;
        in: string;
    }
    export type HeaderObject = ParameterBaseObject;
    interface ParameterBaseObject {
        description?: string;
        required?: boolean;
        deprecated?: boolean;
        allowEmptyValue?: boolean;
        style?: string;
        explode?: boolean;
        allowReserved?: boolean;
        schema?: ReferenceObject | SchemaObject;
        example?: any;
        examples?: {
            [media: string]: ReferenceObject | ExampleObject;
        };
        content?: {
            [media: string]: MediaTypeObject;
        };
    }
    export type SchemaObject = ArraySchemaObject | NonArraySchemaObject | AllOfSchemaObject | OneOfSchemaObject | anyOfSchemaObject | notSchemaObject;
    export interface AllOfSchemaObject extends BaseSchemaObject {
        allOf: Array<ReferenceObject | SchemaObject>;
    }
    export interface OneOfSchemaObject extends BaseSchemaObject {
        oneOf: Array<ReferenceObject | SchemaObject>;
    }
    export interface anyOfSchemaObject extends BaseSchemaObject {
        anyOf: Array<ReferenceObject | SchemaObject>;
    }
    export interface notSchemaObject extends BaseSchemaObject {
        not?: ReferenceObject | SchemaObject;
    }
    export type ArraySchemaObjectType = 'array';
    export interface ArraySchemaObject extends BaseSchemaObject {
        type: ArraySchemaObjectType | string;
        items: ReferenceObject | SchemaObject;
    }
    export type NonArraySchemaObjectType = 'null' | 'boolean' | 'object' | 'number' | 'string' | 'integer';
    export interface NonArraySchemaObject extends BaseSchemaObject {
        type: NonArraySchemaObjectType | string;
    }
    interface BaseSchemaObject {
        title?: string;
        description?: string;
        format?: string;
        default?: any;
        multipleOf?: number;
        maximum?: number;
        exclusiveMaximum?: boolean;
        minimum?: number;
        exclusiveMinimum?: boolean;
        maxLength?: number;
        minLength?: number;
        pattern?: string;
        additionalProperties?: boolean | ReferenceObject | SchemaObject;
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
        maxProperties?: number;
        minProperties?: number;
        required?: string[];
        enum?: any[];
        properties?: {
            [name: string]: ReferenceObject | SchemaObject;
        };
        nullable?: boolean;
        discriminator?: DiscriminatorObject;
        readOnly?: boolean;
        writeOnly?: boolean;
        xml?: XMLObject;
        externalDocs?: ExternalDocumentationObject;
        example?: any;
        deprecated?: boolean;
        componentId?: string;
        allOf?: Array<ReferenceObject | SchemaObject>;
        oneOf?: Array<ReferenceObject | SchemaObject>;
        anyOf?: Array<ReferenceObject | SchemaObject>;
        not?: ReferenceObject | SchemaObject;
    }
    export interface DiscriminatorObject {
        propertyName: string;
        mapping?: {
            [value: string]: string;
        };
    }
    export interface XMLObject {
        name?: string;
        namespace?: string;
        prefix?: string;
        attribute?: boolean;
        wrapped?: boolean;
    }
    export interface ReferenceObject {
        $ref: string;
    }
    export interface ExampleObject {
        summary?: string;
        description?: string;
        value?: any;
        externalValue?: string;
    }
    export interface MediaTypeObject {
        schema?: ReferenceObject | SchemaObject;
        example?: any;
        examples?: {
            [media: string]: ReferenceObject | ExampleObject;
        };
        encoding?: {
            [media: string]: EncodingObject;
        };
    }
    export interface EncodingObject {
        contentType?: string;
        headers?: {
            [header: string]: ReferenceObject | HeaderObject;
        };
        style?: string;
        explode?: boolean;
        allowReserved?: boolean;
    }
    export interface RequestBodyObject {
        description?: string;
        content: {
            [media: string]: MediaTypeObject;
        };
        required?: boolean;
    }
    export interface ResponsesObject {
        [code: string]: ReferenceObject | ResponseObject;
    }
    export interface ResponseObject {
        description: string;
        headers?: {
            [header: string]: ReferenceObject | HeaderObject;
        };
        content?: {
            [media: string]: MediaTypeObject;
        };
        links?: {
            [link: string]: ReferenceObject | LinkObject;
        };
    }
    export interface LinkObject {
        operationRef?: string;
        operationId?: string;
        parameters?: {
            [parameter: string]: any;
        };
        requestBody?: any;
        description?: string;
        server?: ServerObject;
    }
    export interface CallbackObject {
        [url: string]: PathItemObject;
    }
    export interface SecurityRequirementObject {
        [name: string]: string[];
    }
    export interface ComponentsObject {
        schemas?: {
            [key: string]: ReferenceObject | SchemaObject;
        };
        responses?: {
            [key: string]: ReferenceObject | ResponseObject;
        };
        parameters?: {
            [key: string]: ReferenceObject | ParameterObject;
        };
        examples?: {
            [key: string]: ReferenceObject | ExampleObject;
        };
        requestBodies?: {
            [key: string]: ReferenceObject | RequestBodyObject;
        };
        headers?: {
            [key: string]: ReferenceObject | HeaderObject;
        };
        securitySchemes?: {
            [key: string]: ReferenceObject | SecuritySchemeObject;
        };
        links?: {
            [key: string]: ReferenceObject | LinkObject;
        };
        callbacks?: {
            [key: string]: ReferenceObject | CallbackObject;
        };
    }
    export type SecuritySchemeObject = HttpSecurityScheme | ApiKeySecurityScheme | OAuth2SecurityScheme | OpenIdSecurityScheme;
    export interface HttpSecurityScheme {
        type: 'http' | string;
        description?: string;
        scheme: string;
        bearerFormat?: string;
    }
    export interface ApiKeySecurityScheme {
        type: 'apiKey' | string;
        description?: string;
        name: string;
        in: string;
    }
    export interface OAuth2SecurityScheme {
        type: 'oauth2' | string;
        description?: string;
        flows: {
            implicit?: {
                authorizationUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
            password?: {
                tokenUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
            clientCredentials?: {
                tokenUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
            authorizationCode?: {
                authorizationUrl: string;
                tokenUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
        };
    }
    export interface OpenIdSecurityScheme {
        type: 'openIdConnect' | string;
        description?: string;
        openIdConnectUrl: string;
    }
    export interface TagObject {
        name: string;
        description?: string;
        externalDocs?: ExternalDocumentationObject;
    }
    export {};
}
export interface OpenAPIFrameworkPathObject {
    path?: string;
    module?: any;
}
interface OpenAPIFrameworkArgs {
    apiDoc: OpenAPIV3.Document | Promise<OpenAPIV3.Document> | string;
}
export interface OpenAPIFrameworkAPIContext {
    basePaths: string[];
    getApiDoc(): OpenAPIV3.Document;
}
export interface OpenApiRequest {
    route: string;
    method?: string;
    httpMethod?: string;
    query?: Record<string, string>;
    queryStringParameters?: Record<string, string>;
    headers?: Record<string, string>;
    body?: string;
    cookies?: Record<string, string>;
    path?: Record<string, unknown>;
    pathParameters?: Record<string, unknown>;
}
export interface IJsonSchema {
    id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalItems?: boolean | IJsonSchema;
    items?: IJsonSchema | IJsonSchema[];
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: boolean | IJsonSchema;
    definitions?: {
        [name: string]: IJsonSchema;
    };
    properties?: {
        [name: string]: IJsonSchema;
    };
    patternProperties?: {
        [name: string]: IJsonSchema;
    };
    dependencies?: {
        [name: string]: IJsonSchema | string[];
    };
    enum?: any[];
    type?: string | string[];
    allOf?: IJsonSchema[];
    anyOf?: IJsonSchema[];
    oneOf?: IJsonSchema[];
    not?: IJsonSchema;
}
export interface ValidationError {
    message?: string;
    status: number;
    errors: ValidationErrorItem[];
}
export interface ValidationErrorItem {
    path: string;
    message: string;
    fullMessage?: string;
}
interface ErrorHeaders {
    Allow?: string;
}
export declare class BadRequest extends Error implements ValidationError {
    status: number;
    path?: string;
    name: string;
    message: string;
    headers?: ErrorHeaders;
    errors: ValidationErrorItem[];
    constructor(err: {
        path: string;
        message?: string;
        errors?: ValidationErrorItem[];
    });
}
export { OpenAPIFrameworkArgs };
export { ErrorObject };
export type OpenApiRequestHandler = (req: OpenApiRequest) => ValidationResult;
export type RequestData = {
    query: Record<string, any>;
    headers: Record<string, any>;
    path: Record<string, any>;
    cookies: Record<string, any>;
    body: Record<string, any>;
};
export type ValidationResult = {
    valid: boolean;
} & RequestData;
export declare class SchemaNotFoundError extends Error {
    status: number;
    name: string;
    message: string;
    path: string;
    method: string;
    constructor(err: {
        path: string;
        method: string;
        message?: string;
    });
}
export declare class OpenApiValidationError extends Error {
    path?: string;
    errors: ValidationErrorItem[];
    constructor(err: {
        path: string;
        message?: string;
        errors?: ValidationErrorItem[];
    });
}
export declare class OpenApiSchemaParseError extends Error {
    path?: string;
    constructor(err: {
        path: string;
        message?: string;
    });
}
