import { RequestValidator } from './lib/RequestValidator';
import {
  OpenApiValidatorOpts,
  OpenApiRequest,
  OpenAPIV3,
  ValidationResult,
} from './lib/types';
import { defaultSerDes } from './lib/BaseSerdes';
import { AjvOptions } from './lib/ajvOptions';
export { OpenApiValidatorOpts } from './lib/types';

export class OpenApiValidator {
  readonly options: OpenApiValidatorOpts;
  readonly ajvOpts: AjvOptions;
  private spec?: OpenAPIV3.Document;

  constructor(options: OpenApiValidatorOpts) {
    this.validateOptions(options);
    this.normalizeOptions(options);

    if (!options.validateRequests && options.validateRequests !== false) {
      options.validateRequests = true;
    }

    if (options.validateRequests === true) {
      options.validateRequests = {
        allowUnknownQueryParameters: false
      };
    }

    this.options = options;
    this.ajvOpts = new AjvOptions(options);
  }
  async getSpec() {
    if (!this.spec) {
      this.spec = await this.loadSpec(this.options.apiSpec);
    }
    return this.spec;
  }

  createValidator(): (request: OpenApiRequest) => Promise<ValidationResult> {

    let requestValidator: RequestValidator;
    return async (request: OpenApiRequest): Promise<ValidationResult> => {
      if (!requestValidator) {
        const spec = await this.getSpec();
        // [skip_preprocess]
        // const ajvOpts = this.ajvOpts.preprocessor;
        // const { SchemaPreprocessor } = require('./middlewares/parsers/schema.preprocessor');
        // new SchemaPreprocessor(spec, ajvOpts).preProcess();
        requestValidator = new RequestValidator(spec, this.ajvOpts.request, this.options.customErrorFn);
      }
      const result = requestValidator.validate(request);
      return result;
    };
  }

  private async loadSpec(schemaOrPath: Promise<object> | string | object): Promise<OpenAPIV3.Document> {
    if (typeof schemaOrPath === 'string') {
      const origCwd = process.cwd();
      const path = require('path');
      const absolutePath = path.resolve(origCwd, schemaOrPath);
      const { access } = require('fs').promises;
      await access(absolutePath);
      const $RefParser = require('@apidevtools/json-schema-ref-parser');
      return Object.assign($RefParser.dereference(absolutePath));
    }

    // Test the full parser
    // const $RefParser = require('@apidevtools/json-schema-ref-parser');
    // const result = await $RefParser.dereference(await schemaOrPath);
    const cloneDeep = require('lodash.clonedeep');
    const dereference = require('@apidevtools/json-schema-ref-parser/lib/dereference');
    const $Refs = require('@apidevtools/json-schema-ref-parser/lib/refs');

    const handler = { schema: null, $refs: new $Refs() };
    // eslint-disable-next-line no-underscore-dangle
    const $ref = handler.$refs._add('');
    $ref.value = cloneDeep(await schemaOrPath);
    $ref.pathType = 'http';
    handler.schema = $ref.value;
    dereference(handler, { parse: {}, dereference: { excludedPathMatcher: () => false } });
    return Object.assign(handler.schema as unknown as Object);
  }

  // public async loadValidator(): Promise<(request: OpenApiRequest) => Promise<void>> {
  //   const requestValidator = new RequestValidator(null, this.ajvOpts.request, this.options.customErrorFn);
  //   await requestValidator.loadCompiled(this.options.compiledFilePath);
  //   return async (request: OpenApiRequest): Promise<void> => {
  //     await requestValidator.validate(request);
  //   };
  // }

  private validateOptions(options: OpenApiValidatorOpts): void {
    if (!options.apiSpec && !options.compiledFilePath) {
      throw Error('apiSpec required');
    }
  }

  private normalizeOptions(options: OpenApiValidatorOpts): void {
    if (!options.serDes) {
      options.serDes = defaultSerDes;
    } else {
      defaultSerDes.forEach(currentDefaultSerDes => {
        const defaultSerDesOverride = options.serDes!.find(
          currentOptionSerDes => {
            return currentDefaultSerDes.format === currentOptionSerDes.format;
          }
        );
        if (!defaultSerDesOverride) {
          options.serDes!.push(currentDefaultSerDes);
        }
      });
    }
  }
}
