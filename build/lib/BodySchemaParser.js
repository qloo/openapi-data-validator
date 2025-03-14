"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodySchemaParser = void 0;
class BodySchemaParser {
    parse(path, pathSchema, contentType) {
        const requestBody = pathSchema.requestBody;
        if (Object.hasOwnProperty.call(requestBody || {}, 'content')) {
            return this.toSchema(path, contentType, requestBody);
        }
        return {};
    }
    toSchema(path, contentType, requestBody) {
        if (!requestBody?.content) {
            return {};
        }
        let content = null;
        for (const type of contentType.equivalents()) {
            content = requestBody.content[type];
            if (content) {
                return content.schema ?? {};
            }
        }
        for (const requestContentType of Object.keys(requestBody.content).sort().reverse()) {
            if (requestContentType === '*/*') {
                content = requestBody.content[requestContentType];
                break;
            }
            if (!new RegExp(/^[a-z]+\/\*$/).test(requestContentType)) {
                continue;
            }
            const [type] = requestContentType.split('/', 1);
            if (new RegExp(`^${type}/.+$`).test(contentType.contentType)) {
                content = requestBody.content[requestContentType];
                break;
            }
        }
        if (!content) {
            content = Object.values(requestBody.content)[0];
        }
        return content?.schema ?? {};
    }
}
exports.BodySchemaParser = BodySchemaParser;
//# sourceMappingURL=BodySchemaParser.js.map