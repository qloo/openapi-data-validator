"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dereferenceParameter = dereferenceParameter;
exports.normalizeParameter = normalizeParameter;
exports.dereferenceSchema = dereferenceSchema;
function dereferenceParameter(apiDocs, parameter) {
    if (is$Ref(parameter)) {
        const p = parameter;
        const id = p.$ref.replace(/^.+\//i, '');
        return apiDocs.components.parameters[id];
    }
    return parameter;
}
function normalizeParameter(ajv, parameter) {
    let schema;
    if (is$Ref(parameter)) {
        schema = dereferenceSchema(ajv, parameter['$ref']);
    }
    else if (parameter?.schema?.['$ref']) {
        schema = dereferenceSchema(ajv, parameter.schema['$ref']);
    }
    else {
        schema = parameter.schema;
    }
    if (!schema && parameter.content) {
        const contentType = Object.keys(parameter.content)[0];
        schema = parameter.content?.[contentType]?.schema;
    }
    if (!schema) {
        schema = parameter;
    }
    applyParameterStyle(parameter);
    applyParameterExplode(parameter);
    const name = parameter.in === 'header' ? parameter.name.toLowerCase() : parameter.name;
    return { name, schema: schema };
}
function applyParameterStyle(param) {
    if (!param.style) {
        if (param.in === 'path') {
            param.style = 'simple';
        }
        else if (param.in === 'query') {
            param.style = 'form';
        }
        else if (param.style === 'header') {
            param.style = 'simple';
        }
        else if (param.style === 'cookie') {
            param.style = 'form';
        }
    }
}
function applyParameterExplode(param) {
    if (!param.explode && param.explode !== false) {
        if (param.in === 'path') {
            param.explode = false;
        }
        else if (param.in === 'query') {
            param.explode = false;
        }
        else if (param.style === 'header') {
            param.explode = false;
        }
        else if (param.style === 'cookie') {
            param.explode = true;
        }
    }
}
function dereferenceSchema(ajv, ref) {
    const derefSchema = ajv.getSchema(ref);
    if (derefSchema?.['$ref']) {
        return dereferenceSchema(ajv, '');
    }
    return derefSchema?.schema;
}
function is$Ref(parameter) {
    return Object.hasOwnProperty.call(parameter, '$ref');
}
//# sourceMappingURL=ParserUtil.js.map