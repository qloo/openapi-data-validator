import Ajv, { ErrorObject } from 'ajv';
import { ParametersSchemaParser } from './ParametersSchemaParser';
import { BodySchemaParser } from './BodySchemaParser';
import { createRequestAjv } from './ajv';

import {
  ContentType,
  ajvErrorsToValidatorError,
  augmentAjvErrors,
  processFormStyleArrays
} from './ValidationUtil';
import {
  OpenAPIV3,
  OpenApiRequest,
  RequestValidatorOptions,
  ValidateRequestOpts,
  BadRequest,
  ParametersSchema,
  BodySchema,
  OpenApiRequestHandler,
  BodyWithFormat,
  RequestData,
  ValidationResult,
  SchemaNotFoundError
} from './types';


type SchemaObject = OpenAPIV3.SchemaObject;

function getSchemaGeneral(validationId: string, parameters: ParametersSchema, body: BodySchema): object {
  // $schema: "http://json-schema.org/draft-04/schema#",
  // eslint-disable-next-line dot-notation
  // const isBodyBinary = body?.['format'] === 'binary';
  const isBodyBinary = (body as BodyWithFormat)?.format === 'binary';
  const bodyProps = !isBodyBinary && body || {};
  const bodySchema = {
    $id: validationId,
    required: ['query', 'headers', 'path'],
    properties: {
      body: bodyProps,
      ...parameters
    }
  };

  const requireBody = (<SchemaObject>body).required && !isBodyBinary;
  if (requireBody) {
    (<any>bodySchema).required.push('body');
  }

  return bodySchema;
}

export class RequestValidator {
  private validatorCache: { [key: string]: OpenApiRequestHandler } = {};
  private apiDoc: OpenAPIV3.Document;
  private requestOpts: ValidateRequestOpts = {};
  private options: RequestValidatorOptions;
  private validationModule: unknown = {};
  private ajv: Ajv;
  private customErrorFn?: (e: ErrorObject) => string;

  constructor(
    apiDoc: OpenAPIV3.Document,
    options: RequestValidatorOptions = {},
    customErrorFn?: (e: ErrorObject) => string
  ) {
    this.validatorCache = {};
    this.apiDoc = apiDoc;
    this.requestOpts.allowUnknownQueryParameters = options.allowUnknownQueryParameters;

    this.options = options;
    this.customErrorFn = customErrorFn;

    this.ajv = createRequestAjv(this.apiDoc, {
      ...this.options,
      addUsedSchema: true,  // This enables tracking of used schemas
      schemas: [this.apiDoc]
    });
  }

  public validate(req: OpenApiRequest): ValidationResult {
    const route = req.route;
    // cache middleware by combining method, path, and contentType
    const contentType = ContentType.from(req);
    const contentTypeKey = contentType.equivalents()[0] ?? 'not_provided';
    const key = `${req.method || req.httpMethod}-${route}-${contentTypeKey}`.toLocaleLowerCase();
    // console.debug('oapi-data-validator middlewarecache key', key);
    // so far in my tests i only get "not_provided" as the contentTypeKey

    // TODO:  read in entire spec and initialize all possible key combinations
    // in constructor so that this happens during Lambda warmup and never
    // during a normal request note: maybe we just set a default to
    // application/json?

    if (!this.validatorCache[key]) {
      // TODO:  what are validation modules for?
      // only know that they're not used in our regular use case
      // if (this.validationModule[key]) {
      //   this.middlewareCache[key] = this.buildMiddlewareFromModule(key);
      // } else {
      if (!(req.method || req.httpMethod)) {
        throw new Error('Request method is required');
      }
      this.validatorCache[key] = this.buildValidator(key, route, (req.method || req.httpMethod) as string, contentType);
      // }
    }

    return this.validatorCache[key](req) as ValidationResult;
  }


  private buildValidator(
    validationId: string,
    path: string,
    method: string,
    contentType: ContentType
  ): OpenApiRequestHandler {
    const reqSchema = this.apiDoc && this.apiDoc.paths[path] &&
      this.apiDoc.paths[path as keyof
      OpenAPIV3.PathsObject][method.toLowerCase() as keyof
      OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
    if (!reqSchema) {
      throw new SchemaNotFoundError({method, path});
    }

    const schemaParser = new ParametersSchemaParser(this.ajv, this.apiDoc);
    const parameters = schemaParser.parse(path, reqSchema.parameters);
    const body = new BodySchemaParser().parse(path, reqSchema, contentType);
    const schemaGeneral = getSchemaGeneral(validationId, parameters, body);
    const validator = this.ajv.compile(schemaGeneral);

    return (req: OpenApiRequest): ValidationResult => {
      let data = {
        query: req.query ?? req.queryStringParameters ?? {},
        headers: req.headers ?? {},
        path: req.path ?? req.pathParameters ?? {},
        cookies: req.cookies ?? {},
        body: req.body
      };

      // TODO: what other type coercion needs to happen here?  Perhaps none.
      // Pre-process form style arrays (e.g. types=type1,type2 => types=["type1", "type2"])
      data = processFormStyleArrays(data, reqSchema.parameters as OpenAPIV3.ParameterObject[]);

      const valid = validator(data);
      // validator(data) augments the data input with coerced types and default values.
      // These are ajv constructor options
      const requestData = data as unknown as RequestData;
      if (valid) {
        return {
          valid: true,
          ...requestData, // requestData has coerced types and default values applied.  These are ajv constructor options
        };
      }

      // augmentAjvErrors: if keyword is enum, change e.message to have
      // allowedEnumValues
      const errors = augmentAjvErrors(validator.errors ?? [] as ErrorObject[], data);
      const formattedErrors = ajvErrorsToValidatorError(errors, this.customErrorFn);
      const message = formattedErrors.map(m => m.fullMessage).join(', ');

      // TODO: switch to just returning all the errors
      // allowing the caller to decide what to do with them
      const error: BadRequest = new BadRequest({
        path: req.route,
        message,
      });
      error.errors = formattedErrors;
      throw error;
    };
  }

  // // [2025-03-03 hahn] appears unneeded:
  // public async compile(filepath: string): Promise<void> {
  //   const { createRequestAjv } = require('../framework/ajv');
  //   const { BodySchemaParser } = require('./parsers/body.parse');
  //   const { ParametersSchemaParser } = require('./parsers/schema.parse');
  //   const ajvCompiled = createRequestAjv(this.apiDoc, Object.assign({ code: { source: true } }, this.options));
  //   const keyMap: Record<string, unknown> = {};
  //   for (const path of Object.keys(this.apiDoc.paths)) {
  //     for (const method of Object.keys(this.apiDoc.paths[path])) {
  //       const reqSchema = this.apiDoc.paths[path][method as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
  //       const schemaParser = new ParametersSchemaParser(ajvCompiled, this.apiDoc);
  //       const parameters = schemaParser.parse(path, reqSchema.parameters);

  //       // Include no body with `null`
  //       let defaultKey;
  //       // for (const contentTypeRaw of Object.keys(reqSchema.requestBody?.content || {}).concat(null)) {
  //       for (const contentTypeRaw of [...Object.keys((reqSchema.requestBody as OpenAPIV3.RequestBodyObject)?.content || {}), null] as (string | null)[]) {
  //         const contentTypeData = ContentType.fromString(contentTypeRaw!);
  //         const contentTypeKey = (contentTypeRaw && contentTypeData.equivalents()[0]) ?? 'not_provided';
  //         const key = `${method}-${path}-${contentTypeKey}`.toLocaleLowerCase();
  //         if (!contentTypeRaw && defaultKey) {
  //           keyMap[key] = defaultKey;
  //           continue;
  //         }
  //         keyMap[key] = defaultKey = key;
  //         const body = contentTypeRaw && new BodySchemaParser().parse(path, reqSchema, contentTypeData);

  //         // eslint-disable-next-line dot-notation
  //         const isBodyBinary = body?.['format'] === 'binary';
  //         const bodyProps = !isBodyBinary && body || {};
  //         const bodySchema = {
  //           $id: key,
  //           required: ['query', 'headers', 'path'],
  //           properties: {
  //             query: {
  //               additionalProperties: !!this.requestOpts.allowUnknownQueryParameters
  //             },
  //             headers: {},
  //             path: {},
  //             cookies: {},
  //             body: bodyProps,
  //             ...parameters
  //           }
  //         };

  //         const requireBody = (<SchemaObject>body)?.required && !isBodyBinary;
  //         if (requireBody) {
  //           (<any>bodySchema).required.push('body');
  //         }
  //         ajvCompiled.addSchema(bodySchema);
  //       }
  //     }
  //   }

  //   const standaloneCode = require('ajv/dist/standalone').default;
  //   const moduleCode = standaloneCode(ajvCompiled, keyMap);
  //   if (filepath) {
  //     await writeFile(filepath, moduleCode);
  //   }
  // }

  // public async loadCompiled(filepath: string): Promise<void> {
  //   const moduleCode = await readFile(filepath);
  //   this.validationModule = require('require-from-string')(moduleCode.toString());
  // }

  // private buildMiddlewareFromModule(validationId: string): OpenApiRequestHandler {
  //   return (req: OpenApiRequest): void => {
  //     const data = {
  //       query: req.query ?? req.queryStringParameters ?? {},
  //       headers: req.headers ?? {},
  //       path: req.path ?? req.pathParameters ?? {},
  //       cookies: req.cookies ?? {},
  //       body: req.body
  //     };

  //     const validator = this.validationModule[validationId];
  //     const valid = validator(data);

  //     if (valid) {
  //       return;
  //     }

  //     const errors = augmentAjvErrors([].concat(validator.errors ?? []), data);
  //     const formattedErrors = ajvErrorsToValidatorError(errors, this.customErrorFn);
  //     let message = 'No errors';
  //     if (formattedErrors.length) {
  //       message = formattedErrors.map(m => m.fullMessage).join(', ');
  //     }
  //     const error: BadRequest = new BadRequest({
  //       path: req.route,
  //       message: message
  //     });
  //     error.errors = formattedErrors;
  //     throw error;
  //   };
  // }
}
