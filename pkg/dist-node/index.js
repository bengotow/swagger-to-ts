'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var prettier = require('prettier');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

const TYPES = {
  string: 'string',
  integer: 'number',
  number: 'number'
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
  const definitions = spec.definitions;

  function getRef(lookup) {
    const ID = lookup.replace('#/definitions/', '');
    const ref = definitions[ID];
    return [ID, ref];
  }

  function getType(definition, nestedName) {
    const $ref = definition.$ref,
          items = definition.items,
          type = definition.type,
          value = _objectWithoutProperties(definition, ["$ref", "items", "type"]);

    const DEFAULT_TYPE = 'any';

    if ($ref) {
      const _getRef = getRef($ref),
            _getRef2 = _slicedToArray(_getRef, 2),
            refName = _getRef2[0],
            refProperties = _getRef2[1];

      if (refProperties.items && refProperties.items.$ref) {
        return getType(refProperties, refName);
      }

      if (refProperties.type && TYPES[refProperties.type]) {
        return TYPES[refProperties.type];
      }

      return refName || DEFAULT_TYPE;
    }

    if (items && items.$ref) {
      const _getRef3 = getRef(items.$ref),
            _getRef4 = _slicedToArray(_getRef3, 1),
            refName = _getRef4[0];

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
      queue.push([nestedName, _objectSpread({
        $ref,
        items,
        type
      }, value)]);
      return nestedName;
    }

    if (type === 'object' && value.additionalProperties && value.additionalProperties !== true && value.additionalProperties['$ref']) {
      const _getRef5 = getRef(value.additionalProperties['$ref']),
            _getRef6 = _slicedToArray(_getRef5, 1),
            refName = _getRef6[0];

      return `{[key: string]: ${refName}}`;
    }

    if (type) {
      return TYPES[type] || type || DEFAULT_TYPE;
    }

    return DEFAULT_TYPE;
  }

  function buildNextInterface() {
    const nextObject = queue.pop();
    if (!nextObject) return;

    const _nextObject = _slicedToArray(nextObject, 2),
          ID = _nextObject[0],
          _nextObject$ = _nextObject[1],
          allOf = _nextObject$.allOf,
          properties = _nextObject$.properties,
          required = _nextObject$.required,
          additionalProperties = _nextObject$.additionalProperties,
          type = _nextObject$.type;

    let allProperties = properties || {};
    const includes = [];

    if (Array.isArray(allOf)) {
      allOf.forEach(item => {
        if (item.$ref) {
          const _getRef7 = getRef(item.$ref),
                _getRef8 = _slicedToArray(_getRef7, 1),
                refName = _getRef8[0];

          includes.push(refName);
        } else if (item.properties) {
          allProperties = _objectSpread({}, allProperties, item.properties);
        }
      });
    }

    if (!Object.keys(allProperties).length && additionalProperties !== true && type && TYPES[type]) {
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
        output.push(`/** ${value.description.replace(/\n$/, '').replace(/\n/g, '\n// ')} */`);
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
  return prettier.format(output.join('\n'), {
    parser: 'typescript',
    singleQuote: true
  });
}

function index (spec, options) {
  const swagger = options && options.swagger || 2;

  if (swagger !== 2) {
    throw new Error(`Swagger version ${swagger} is not supported`);
  }

  return parse(spec, options);
}

exports.default = index;
