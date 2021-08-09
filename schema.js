const ERROR = require('./error');

function isArrow(f) {
	return /^(async)?\s*\(([\w$]?[\w\d$]*\s*,\s*)*([\w$]?[\w\d$]*\s*)?\)\s*=>/g.test(f.toString());
}

function isFunc(f) {
	return /^[^(]*function[^(]*\(/g.test(f.toString());
}

function serialize(o, state) {
	const type = typeof o;
	let name = '0';
	if (o === undefined || o === null) {
		name = String(o);
	} else {
		const prototype = Object.getPrototypeOf(o);
		if (prototype && prototype.constructor) name = prototype.constructor.name;
	}
	const typeSerializer = Schema[type];
	try {
		const parsed = (typeSerializer[name] ?? typeSerializer['0'])(state, o);
		if (typeof parsed === 'undefined') throw ERROR.NotSupported(`Type <${type}> with name <${name}> is not implemented`);
		return parsed;
	} catch (e) {
		throw ERROR.Serialize(e);
	}
}

function deserialize(s) {
	try {
		return Function(s)();
	} catch (e) {
		throw ERROR.Deserialize(e);
	}
}

const Schema = {
	object: {
		// Catch all
		'0'(state, o) {
			if (o === null) return 'null';
			const c = Object.getPrototypeOf(o);
			const objString = c.constructor.toString();
			const name = c.constructor.name;
			if ((c.constructor.$box || o.$box)) {
				if (c.constructor.$unbox) {
					if (c.constructor.$box) {
						state.classes.add(objString);
						return `${name}.$unbox(${c.constructor.$box(o)})`;
					} else if (o.$box) {
						state.classes.add(objString);
						return `${name}.$unbox(${o.$box()})`;
					}
				}
				throw new Error('Must have both $box and $unbox methods');
			}
			state.classes.add(objString);
			return `Object.assign(Object.create(${name}.prototype),${Schema.object.Object(state, o)})`;
		},

		// General objects
		Object(state, o) {
			return `{${
				Object.entries(o)
					.map(([key, value]) => (typeof value === 'function' && (!isArrow(value) && !isFunc(value))
						? serialize(value, state)
						: `${JSON.stringify(key)}: ${serialize(value, state)}`))
					.join(',')
			}}`;
		},

		// Time
		Date(state, d) {
			return `new Date(${d.getTime()})`;
		},

		// Structures
		Map(state, m) {
			if (m.size === 0) return 'new Map()';
			let serialized = 'new Map([';
			for (const [key, value] of m.entries()) serialized += `[${serialize(key, state)}, ${serialize(value, state)}],`;

			serialized = `${serialized.substring(0, serialized.length - 1)}])`;
			return serialized;
		},
		Set(state, s) {
			if (s.size === 0) return 'new Set()';
			let serialized = 'new Set([';
			for (const value of s.values()) serialized += `${serialize(value, state)},`;

			serialized = `${serialized.substring(0, serialized.length - 1)}])`;
			return serialized;
		},

		// RegExp
		RegExp(state, r) {
			return r.toString();
		},

		// Primitives
		Boolean(state, b) {
			return `new Boolean(${b.toString()})`;
		},
		Number(state, n) {
			return `new Number(${n.toString()})`;
		},
		String(state, s) {
			return `new String(${Schema.string.String(state, s.toString())})`;
		},

		// Errors
		Error(state, e, t = 'Error') {
			return `Object.assign(new ${t}(${
				e.message ? JSON.stringify(e.message) : ''
			}), {stack: ${Schema.string.String(state, e.stack)}})`;
		},
		AggregateError(state, e) {
			return `new AggregateError([${
				e.errors.map(i => serialize(i)).join(',')
			}]${e.message ? `, ${JSON.stringify(e.message)}` : ''})`;
		},
		EvalError(state, e) {
			return Schema.object.Error(state, e, 'EvalError');
		},
		RangeError(state, e) {
			return Schema.object.Error(state, e, 'RangeError');
		},
		ReferenceError(state, e) {
			return Schema.object.Error(state, e, 'ReferenceError');
		},
		SyntaxError(state, e) {
			return Schema.object.Error(state, e, 'SyntaxError');
		},
		TypeError(state, e) {
			return Schema.object.Error(state, e, 'TypeError');
		},
		URIError(state, e) {
			return Schema.object.Error(state, e, 'URIError');
		},

		// Buffer view
		DataView(state, d) {
			return `new DataView(${serialize(d.buffer, state)}, ${d.byteOffset}, ${d.byteLength})`;
		},

		// Arrays
		Array(state, a, t) {
			if (a.every(a => a === undefined)) {
				if (t) return `new ${t}()`;
				return `[${a.join(',')},]`;
			}
			if (t) return `new ${t}([${a.join(',')}])`;
			return `[${a.map(v => serialize(v, state)).toString()}]`;
		},
		ArrayBuffer(state, b) {
			return `new ArrayBuffer(${b.byteLength})`;
		},
		SharedArrayBuffer(state, b) {
			return `new SharedArrayBuffer(${b.byteLength})`;
		},
		BigInt64Array(state, a) {
			return Schema.object.Array(state, [...a].map(i => Schema.bigint.BigInt(state, i)), 'BigInt64Array');
		},
		BigUint64Array(state, a) {
			return Schema.object.Array(state, [...a].map(i => Schema.bigint.BigInt(state, i)), 'BigUint64Array');
		},
		Float32Array(state, a) {
			return Schema.object.Array(state, a, 'Float32Array');
		},
		Float64Array(state, a) {
			return Schema.object.Array(state, a, 'Float64Array');
		},
		Int8Array(state, a) {
			return Schema.object.Array(state, a, 'Int8Array');
		},
		Int16Array(state, a) {
			return Schema.object.Array(state, a, 'Int16Array');
		},
		Int32Array(state, a) {
			return Schema.object.Array(state, a, 'Int32Array');
		},
		Uint8Array(state, a) {
			return Schema.object.Array(state, a, 'Uint8Array');
		},
		Uint16Array(state, a) {
			return Schema.object.Array(state, a, 'Uint16Array');
		},
		Uint32Array(state, a) {
			return Schema.object.Array(state, a, 'Uint32Array');
		},
		Uint8ClampedArray(state, a) {
			return Schema.object.Array(state, a, 'Uint8ClampedArray');
		},

		// NodeJS Specific
		Buffer(state, b) {
			if (b.length === 0) return 'Buffer.alloc(0)';
			return `Buffer.from('${b.toString('base64')}', 'base64')`;
		},

		// NOT IMPLEMENTED

		// [ Experimental ]
		// InternalError() {},

		// [ Undetectable ]
		// Generator() {},
		// Proxy() {},

		FinalizationRegistry() {},
		Promise() {},
		WeakMap() {},
		WeakRef() {},
		WeakSet() {}
	},
	undefined: {
		undefined() {
			return 'undefined';
		}
	},
	boolean: {
		Boolean(state, b) {
			return b.toString();
		}
	},
	number: {
		Number(state, n) {
			if (isNaN(n)) return 'NaN';
			if (n === Infinity) return 'Infinity';
			return n.toString();
		}
	},
	bigint: {
		BigInt(state, n) {
			return `${n.toString()}n`;
		}
	},
	string: {
		String(state, s) {
			return JSON.stringify(s);
		}
	},
	symbol: {
		// Not Implemented
		Symbol() {}
	},
	function: {
		Function(state, f) {
			if (/{ \[native code\] }$/g.test(f)) return f.name;
			return f.toString();
		},
		AsyncFunction(state, f) {
			return Schema.function.Function(state, f);
		},
		AsyncGeneratorFunction(state, f) {
			return Schema.function.Function(state, f);
		},
		GeneratorFunction(state, f) {
			return Schema.function.Function(state, f);
		}
	}
};

module.exports = {
	serialize,
	deserialize
};
