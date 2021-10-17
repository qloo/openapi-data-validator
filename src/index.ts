import { RequestValidator } from './middlewares/openapi.request.validator';
import {
  OpenApiValidatorOpts,
  OpenApiRequest
} from './framework/types';
import { defaultSerDes } from './framework/base.serdes';
import { SchemaPreprocessor } from './middlewares/parsers/schema.preprocessor';
import { AjvOptions } from './framework/ajv/options';

import { OpenApiSpecLoader } from './framework/openapi.spec.loader';
export { OpenApiValidatorOpts } from './framework/types';

export class OpenApiValidator {
  readonly options: OpenApiValidatorOpts;
  readonly ajvOpts: AjvOptions;

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

  createValidator(): Function {
    const specAsync = new OpenApiSpecLoader({ apiDoc: this.options.apiSpec, validateApiSpec: this.options.validateApiSpec }).load();

    let requestValidator;
    return async (request: OpenApiRequest): Promise<void> => {
      if (!requestValidator) {
        const spec = await specAsync;
        const ajvOpts = this.ajvOpts.preprocessor;
        new SchemaPreprocessor(spec, ajvOpts).preProcess();
        requestValidator = new RequestValidator(spec, this.ajvOpts.request);
      }

      requestValidator.validate(request);
    };
  }

  private validateOptions(options: OpenApiValidatorOpts): void {
    if (!options.apiSpec) {
      throw Error('apiSpec required');
    }
  }

  private normalizeOptions(options: OpenApiValidatorOpts): void {
    if (!options.serDes) {
      options.serDes = defaultSerDes;
    } else {
      defaultSerDes.forEach(currentDefaultSerDes => {
        let defaultSerDesOverride = options.serDes.find(
          currentOptionSerDes => {
            return currentDefaultSerDes.format === currentOptionSerDes.format;
          }
        );
        if (!defaultSerDesOverride) {
          options.serDes.push(currentDefaultSerDes);
        }
      });
    }
  }
}
