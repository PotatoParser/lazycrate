const assert = require('assert');

const lazycrate = require('./index.js');
const {
	box, unbox
} = lazycrate.sync;

const clone = o => unbox(box(o));

const can = (msg, val) => {
	it(`Can box ${msg}`, () => {
		assert.deepStrictEqual(clone(val), val);
	});
};

const cant = (msg, test, regex) => {
	it(`Cannot box ${msg}`, () => {
		assert.throws(test, e => regex.test(e.stack));
	});
};

const cantUnbox = (msg, test, regex) => {
	it(`Cannot unbox ${msg}`, () => {
		assert.throws(test, e => regex.test(e.stack));
	});
};

const asyncCant = (msg, test, regex) => {
	it(`Cannot box ${msg}`, async () => {
		await assert.rejects(test, e => regex.test(e.stack));
	});
};
const asyncCantUnbox = (msg, test, regex) => {
	it(`Cannot unbox ${msg}`, async () => {
		await assert.rejects(test, e => regex.test(e.stack));
	});
};

describe('Objects', () => {
	describe('Custom Objects', () => {
		it('Can automatically box objects', () => {
			class Test {
				constructor() {
					this.data = 0xDEADBEEF;
				}

				method() {
					return this.data;
				}
			}
			const testObj = new Test();

			assert.deepEqual(clone(testObj), testObj);
			assert.deepEqual(clone(testObj).method(), 0xDEADBEEF);
		});
		it('Can box objects according to static method', () => {
			class Test {
				constructor(data) {
					this.data = data;
				}

				static $box(obj) {
					return obj.data * 10;
				}

				static $unbox(data) {
					return new Test(data / 10);
				}
			}
			const testObj = new Test(100);
			assert.deepEqual(clone(testObj), testObj);
		});
		it('Can box objects according to static unbox', () => {
			class Test {
				constructor(data) {
					this.data = data;
				}

				$box() {
					return this.data * 10;
				}

				static $unbox(data) {
					return new Test(data / 10);
				}
			}
			const testObj = new Test(100);
			assert.deepEqual(clone(testObj), testObj);
		});
		describe('Invalid Structures', () => {
			class Test {
				$box() {}
			}
			class Test2 {
				static $box() {}
			}
			cant('with missing $unbox', () => clone(new Test()), /SerializeError/g);
			cant('statically with missing $unbox', () => clone(new Test2()), /SerializeError/g);
		});
	});
	describe('Normal Objects', () => {
		const val = {
			hello: 'World',
			true: false,
			1: 2,
			func() {
				return true;
			}
		};
		it('Can box Normal Objects', () => {
			const cloned = clone(val);
			assert.strictEqual(cloned.hello, val.hello);
			assert.strictEqual(cloned.true, val.true);
			assert.strictEqual(cloned[1], val[1]);
			assert.strictEqual(cloned.func(), val.func());
		});
	});
	describe('Date', () => {
		can('dates', new Date());
	});
	describe('Structures', () => {
		can('empty Map', new Map());
		it('Can box Map', () => {
			const map = new Map([[1, {}], [{}, 2], [true, 'false'], ['false', true]]);
			map.set('test', {});
			assert.deepStrictEqual(clone(map), map);
		});
		can('empty Set', new Set());
		it('Can box Set', () => {
			const set = new Set([1, 2, 3, 4, 'hello', true, false, {}, null, undefined]);
			set.add({});
			assert.deepStrictEqual(clone(set), set);
		});
	});

	describe('RegExp', () => {
		can('regexp object', new RegExp('12345', 'g'));
		can('regexp literal', /12345/g);
	});

	describe('Primitives', () => {
		can('boolean', new Boolean(true));
		can('number', new Number(Math.random()));
		can('string', new String('Hello World!'));
	});
	describe('Errors', () => {
		const message = () => Array(256).fill(0)
			.map(() => String.fromCharCode(Math.floor((Math.random() * (90 - 65)) + 65)))
			.join('');
		it('test', () => {
			const err = new Error('1');
			const err2 = Object.assign(new Error('1'), {
				stack: '1'
			});
			assert.deepStrictEqual(err, err2);
		});
		can('generic Error', new Error(message()));
		can('empty Error', new Error());
		can('AggregateError', new AggregateError([new Error()], message()));
		can('no message AggregateError', new AggregateError([new Error()]));
		can('EvalError', new EvalError(message()));
		can('RangeError', new RangeError(message()));
		can('ReferenceError', new ReferenceError(message()));
		can('SyntaxError', new SyntaxError(message()));
		can('TypeError', new TypeError(message()));
		can('URIError', new URIError(message()));
	});
	describe('Data View', () => {
		const buffer = new ArrayBuffer(256);
		can('DataView', new DataView(buffer));
	});
	describe('Arrays', () => {
		const rand = (chunk = 3) => Math.random().toString()
			.split('.')[1].match(new RegExp(`\\d{1,${chunk}}`, 'g')).map(i => Number(i));
		const bigRand = (chunk = 3) => rand(chunk).map(i => BigInt(i));
		const negate = r => r.map(i => (Math.random() < 0.5 ? -i : i));
		can('generic Array', [1, 2, 3, 4, 'hello', true, false, {}, null, undefined]);
		can('empty Array', Array(256));
		can('empty typed Array', new Uint8Array());
		can('empty typed BigIntArray', new BigInt64Array());
		can('ArrayBuffer', new ArrayBuffer(256));
		can('SharedArrayBuffer', new SharedArrayBuffer(256));
		describe('Typed Arrays', () => {
			can('BigInt64Array', new BigInt64Array(bigRand()));
			can('BigUint64Array', new BigUint64Array(bigRand()));
			can('Float32Array', new Float32Array(negate(Array(256).fill(0)
				.map(() => Math.random()))));
			can('Float64Array', new Float64Array(negate(Array(256).fill(0)
				.map(() => Math.random()))));
			can('Int8Array', new Int8Array(negate(rand())));
			can('Int16Array', new Int16Array(negate(rand())));
			can('Int32Array', new Int32Array(negate(rand())));
			can('Uint8Array', new Uint8Array(rand()));
			can('Uint16Array', new Uint16Array(rand()));
			can('Uint32Array', new Uint32Array(rand()));
			can('Uint8ClampedArray', new Uint8ClampedArray([1, 2, 3, 4]));
		});
	});
	describe('NodeJS Specific', () => {
		const crypto = require('crypto');
		can('Buffer', crypto.randomBytes(256));
		can('empty Buffer', Buffer.alloc(0));
	});
	describe('Not Supported', () => {
		function *gen() {
			yield 1;
		}
		const generator = gen();
		cant('FinalizationRegistry', () => clone(new FinalizationRegistry(() => {})), /NotSupported/g);
		cant('Promise', () => clone(new Promise(resolve => resolve())), /NotSupported/g);
		cant('WeakMap', () => clone(new WeakMap()), /NotSupported/g);
		cant('WeakRef', () => clone(new WeakRef({})), /NotSupported/g);
		cant('WeakSet', () => clone(new WeakSet()), /NotSupported/g);
	});
});

describe('Functions', () => {
	it('Can box functions', () => {
		function test() {
			return 'Hello World';
		}
		assert.deepStrictEqual('Hello World', clone(test)());
	});
	it('Can try to keep native functions', () => {
		box({
			console: {
				log: console.log
			}
		});
	});
	it('Can box generator functions', () => {
		function *generator() {
			yield 1;
			yield 2;
		}
		const generatorCloned = clone(generator);
		const gen = generatorCloned();
		assert.deepStrictEqual(gen.next().value, 1);
		assert.deepStrictEqual(gen.next().value, 2);
	});
	it('Can box async functions', async () => {
		async function test() {
			const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
			await sleep(10);
			return 'Hello World';
		}
		const asyncCloned = clone(test);
		assert.deepStrictEqual(await asyncCloned(), 'Hello World');
	});
	it('Can box async generator functions', async () => {
		async function *generator() {
			const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
			await sleep(10);
			yield 1;
			await sleep(10);
			yield 2;
		}
		const generatorCloned = clone(generator);
		const gen = generatorCloned();
		assert.deepStrictEqual((await gen.next()).value, 1);
		assert.deepStrictEqual((await gen.next()).value, 2);
	});
});

describe('Primitives', () => {
	describe('Undefined', () => {
		can('undefined', undefined);
	});

	describe('Boolean', () => {
		can('true', true);
		can('false', false);
	});

	describe('Number', () => {
		can('NaN', NaN);
		can('Infinity', Infinity);
		can('-Infinity', -Infinity);
		can('numbers', Math.floor(Math.random() * 100000));
		can('negative numbers', Math.floor(Math.random() * -100000));
		can('decimals', Math.random());
		can('0', 0);
	});

	describe('BigInt', () => {
		can('numbers', BigInt(Math.floor(Math.random() * 100000)));
		can('negative numbers', BigInt(Math.floor(Math.random() * -100000)));
		can('0', 0n);
	});

	describe('String', () => {
		can('strings', 'Hello World!🌎');
	});

	describe('Symbol', () => {
		cant('Symbol', () => clone(Symbol()), /NotSupported/g);
	});
});

describe('Synchronous', () => {
	it('Can unbox buffers', () => {
		const set = new Set([1, 2, 3, 4]);
		const boxed = Buffer.from(box(set));
		assert.deepStrictEqual(unbox(boxed), set);
	});
});

describe('Asynchronous', () => {
	it('Can unbox buffers', async () => {
		const set = new Set([1, 2, 3, 4]);
		const boxed = Buffer.from(await lazycrate.box(set));
		assert.deepStrictEqual(await lazycrate.unbox(boxed), set);
	});
	it('Can box/unbox large objects asynchronously', async () => {
		await lazycrate.unbox(await lazycrate.box(require('./index.js')));
	});
	it('Can box/unbox small objects asynchronously', async () => {
		await lazycrate.unbox(await lazycrate.box(new Set([1, 2, 3])));
	});
});

describe('Error Handling', () => {
	describe('Synchronous', () => {
		describe('Boxing', () => {
			cant('no args', () => box(), /BoxError/g);
		});
		describe('Unboxing', () => {
			cantUnbox('no args', () => unbox(), /UnboxError/g);
			cantUnbox('empty input', () => unbox(''), /UnboxError/g);
			cantUnbox('non-string', () => unbox(1), /UnboxError/g);
			cantUnbox('invalid input (deserializeError)', () => unbox('____helloWorld'), /DeserializeError/g);
			cantUnbox('invalid input', () => unbox('____helloWorld'), /UnboxError/g);
		});
	});
	describe('Asynchronous', () => {
		describe('Boxing', () => {
			asyncCant('no args', async () => await lazycrate.box(), /BoxError/g);
		});
		describe('Unboxing', () => {
			asyncCantUnbox('no args', async () => await lazycrate.unbox(), /UnboxError/g);
			asyncCantUnbox('empty input', async () => await lazycrate.unbox(''), /UnboxError/g);
			asyncCantUnbox('non-string', async () => await lazycrate.unbox(1), /UnboxError/g);
			asyncCantUnbox(
				'invalid input (deserializeError)',
				async () => await lazycrate.unbox('____helloWorld'),
				/DeserializeError/g
			);
			asyncCantUnbox('invalid input', async () => await lazycrate.unbox('____helloWorld'), /UnboxError/g);
		});
	});
});

describe('[EXPERIMENTAL] Packaging Modules', () => {
	it('Can package itself', () => {
		clone(require('./index.js'));
	});
});
