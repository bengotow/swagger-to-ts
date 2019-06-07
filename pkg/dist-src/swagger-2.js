import * as prettier from 'prettier';
const TYPES = {
    string: 'string',
    integer: 'number',
    number: 'number',
};
function capitalize(str) {
    return `${str[0].toUpperCase()}${str.slice(1)}`;
}
function camelCase(name) {
    return name.replace(/(-|_|\.|\s)+\w/g, letter => letter.toUpperCase().replace(/[^0-9a-z]/gi, ''));
}
function parse(spec, options = {}) {
    const namespace = options.namespace || 'OpenAPI2';
    const shouldCamelCase = options.camelcase || false;
    const queue = [];
    const output = [];
    output.push(`${options.export === true ? 'export ' : ''}namespace ${namespace} {`);
    const { definitions } = spec;
    function getRef(lookup) {
        const ID = lookup.replace('#/definitions/', '');
        const ref = definitions[ID];
        return [ID, ref];
    }
    function getType(definition, nestedName) {
        const { $ref, items, type, ...value } = definition;
        const DEFAULT_TYPE = 'any';
        if ($ref) {
            const [refName, refProperties] = getRef($ref);
            if (refProperties.items && refProperties.items.$ref) {
                return getType(refProperties, refName);
            }
            if (refProperties.type && TYPES[refProperties.type]) {
                return TYPES[refProperties.type];
            }
            return refName || DEFAULT_TYPE;
        }
        if (items && items.$ref) {
            const [refName] = getRef(items.$ref);
            return `${getType(items, refName)}[]`;
        }
        if (items && items.type) {
            if (TYPES[items.type]) {
                return `${TYPES[items.type]}[]`;
            }
            queue.push([nestedName, items]);
            return `${nestedName}[]`;
        }
        if (Array.isArray(value.oneOf)) {
            return value.oneOf.map(def => getType(def, '')).join(' | ');
        }
        if (value.properties) {
            queue.push([nestedName, { $ref, items, type, ...value }]);
            return nestedName;
        }
        if (type === 'object' &&
            value.additionalProperties &&
            value.additionalProperties !== true &&
            value.additionalProperties['$ref']) {
            const [refName] = getRef(value.additionalProperties['$ref']);
            return `{[key: string]: ${refName}}`;
        }
        if (type) {
            return TYPES[type] || type || DEFAULT_TYPE;
        }
        return DEFAULT_TYPE;
    }
    function buildNextInterface() {
        const nextObject = queue.pop();
        if (!nextObject)
            return;
        const [ID, { allOf, properties, required, additionalProperties, type }] = nextObject;
        let allProperties = properties || {};
        const includes = [];
        if (Array.isArray(allOf)) {
            allOf.forEach(item => {
                if (item.$ref) {
                    const [refName] = getRef(item.$ref);
                    includes.push(refName);
                }
                else if (item.properties) {
                    allProperties = { ...allProperties, ...item.properties };
                }
            });
        }
        if (!Object.keys(allProperties).length &&
            additionalProperties !== true &&
            type &&
            TYPES[type]) {
            return;
        }
        const isExtending = includes.length ? ` extends ${includes.join(', ')}` : '';
        output.push(`export interface ${shouldCamelCase ? camelCase(ID) : ID}${isExtending} {`);
        Object.entries(allProperties).forEach(([key, value]) => {
            const optional = !Array.isArray(required) || required.indexOf(key) === -1;
            const formattedKey = shouldCamelCase ? camelCase(key) : key;
            const name = `${formattedKey}${optional ? '?' : ''}`;
            const newID = `${ID}${capitalize(formattedKey)}`;
            const interfaceType = getType(value, newID);
            if (typeof value.description === 'string') {
                output.push(`/* ${value.description.replace(/\n$/, '').replace(/\n/g, '\n// ')} */`);
            }
            if (Array.isArray(value.enum)) {
                output.push(`${name}: ${value.enum.map(option => JSON.stringify(option)).join(' | ')};`);
                return;
            }
            output.push(`${name}: ${interfaceType};`);
        });
        if (additionalProperties) {
            if (additionalProperties === true) {
                output.push('[name: string]: any');
            }
            if (additionalProperties.type) {
                const interfaceType = getType(additionalProperties, '');
                output.push(`[name: string]: ${interfaceType}`);
            }
        }
        output.push('}');
    }
    Object.entries(definitions).forEach(entry => {
        if (entry[1].type === 'object') {
            queue.push(entry);
        }
    });
    queue.sort((a, b) => a[0].localeCompare(b[0]));
    while (queue.length > 0) {
        buildNextInterface();
    }
    output.push('}');
    return prettier.format(output.join('\n'), { parser: 'typescript', singleQuote: true });
}
export default parse;
//# sourceMappingURL=swagger-2.js.map