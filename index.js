const {
	brotliCompress, brotliDecompress, brotliCompressSync, brotliDecompressSync
} = require('zlib');
const {
	promisify
} = require('util');
const compress = promisify(brotliCompress);
const decompress = promisify(brotliDecompress);

const ERROR = require('./error');
const {
	serialize, deserialize
} = require('./schema');

function syncBox(s) {
	try {
		if (arguments.length !== 1) throw ERROR.Box('Box requires 1 argument');
		const state = {
			classes: new Set()
		};
		let serialized = serialize(s, state);
		const classes = [...state.classes].join('');
		serialized = `'use strict'; ${classes} return (${serialized})`;
		if (serialized.length > 1024) {
			let shrink = brotliCompressSync(Buffer.from(serialized));
			shrink = shrink.toString('base64');
			if (shrink.length < serialized.length) return `@${shrink}`;
		}
		return serialized;
	} catch (e) {
		throw ERROR.Box(e);
	}
}

function syncUnbox(s) {
	try {
		if (arguments.length !== 1) throw ERROR.Unbox('Unbox requires 1 argument');
		if (!s) throw ERROR.Unbox('Unable to unbox empty input');
		if (s instanceof Buffer) s = s.toString();
		if (typeof s !== 'string') throw ERROR.Unbox('Input must be of instance <String> or <Buffer>');
		if (s[0] === '@') s = brotliDecompressSync(Buffer.from(s.substring(1), 'base64')).toString();

		return deserialize(s);
	} catch (e) {
		throw ERROR.Unbox(e);
	}
}

async function box(s) {
	try {
		if (arguments.length !== 1) throw ERROR.Box('Box requires 1 argument');
		const state = {
			classes: new Set()
		};
		let serialized = serialize(s, state);
		const classes = [...state.classes].join('');
		serialized = `'use strict'; ${classes} return (${serialized})`;
		if (serialized.length > 1024) {
			let shrink = await compress(Buffer.from(serialized));
			shrink = shrink.toString('base64');
			if (shrink.length < serialized.length) return `@${shrink}`;
		}
		return serialized;
	} catch (e) {
		throw ERROR.Box(e);
	}
}

async function unbox(s) {
	try {
		if (arguments.length !== 1) throw ERROR.Unbox('Unbox requires 1 argument');
		if (!s) throw ERROR.Unbox('Unable to unbox empty input');
		if (s instanceof Buffer) s = s.toString();
		if (typeof s !== 'string') throw ERROR.Unbox('Input must be of instance <String> or <Buffer>');
		if (s[0] === '@') s = (await decompress(Buffer.from(s.substring(1), 'base64'))).toString();

		return deserialize(s);
	} catch (e) {
		throw ERROR.Unbox(e);
	}
}

module.exports = {
	sync: {
		box: syncBox,
		unbox: syncUnbox
	},
	box,
	unbox
};
