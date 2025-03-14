import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import { OpenAPIV3, Options } from './types';

export function createRequestAjv(
  openApiSpec: OpenAPIV3.Document,
  options: Options = {}
): Ajv {
  const ajvOpts: Options = {
    strictTypes: false,
    discriminator: true,
    allErrors: true,
    // jsPropertySyntax: true, // 2025-03-07 removed b/c ajv-errors won't allow its use
    coerceTypes: 'array',
    useDefaults: true,
    ...options,
    logger: {
      log(...args) { console.log(...args); },
      warn(...args) {
        if (!(args[0] as string)?.match('jsPropertySyntax')) {
          console.warn(...args);
        }
      },
      error(...args) { console.error(...args); }
    }
  };
  const ajv = new Ajv(ajvOpts);
  addErrors(ajv);
  addFormats(ajv);

  ajv.removeKeyword('propertyNames');
  ajv.removeKeyword('contains');
  ajv.removeKeyword('const');

  ajv.addKeyword({ keyword: 'paths' });
  ajv.addKeyword({ keyword: 'components' });
  ajv.addKeyword({ keyword: 'example' });

  if (openApiSpec.components?.schemas) {
    Object.entries(openApiSpec.components.schemas).forEach(([id, schema]) => {
      ajv.addSchema(schema, `#/components/schemas/${id}`);
    });
  }

  return ajv;
}
