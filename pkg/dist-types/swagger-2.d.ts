export interface Swagger2Definition {
    $ref?: string;
    allOf?: Swagger2Definition[];
    description?: string;
    enum?: string[];
    format?: string;
    items?: Swagger2Definition;
    oneOf?: Swagger2Definition[];
    properties?: {
        [index: string]: Swagger2Definition;
    };
    additionalProperties?: boolean | Swagger2Definition;
    required?: string[];
    type?: 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';
}
export interface Swagger2 {
    definitions: {
        [index: string]: Swagger2Definition;
    };
}
export interface Swagger2Options {
    camelcase?: boolean;
    namespace?: string;
    export?: boolean;
}
declare function parse(spec: Swagger2, options?: Swagger2Options): string;
export default parse;
