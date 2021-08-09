class SerializeError extends Error {
	constructor() {
		super(...arguments);
		this.name = 'SerializeError';
	}
}

class NotSupported extends Error {
	constructor() {
		super(...arguments);
		this.name = 'NotSupported';
	}
}

class DeserializeError extends Error {
	constructor() {
		super(...arguments);
		this.name = 'DeserializeError';
	}
}

class UnboxError extends Error {
	constructor() {
		super(...arguments);
		this.name = 'UnboxError';
	}
}

class BoxError extends Error {
	constructor() {
		super(...arguments);
		this.name = 'BoxError';
	}
}

module.exports = {
	Serialize: e => new SerializeError(e),
	NotSupported: e => new NotSupported(e),
	Deserialize: e => new DeserializeError(e),
	Box: e => new BoxError(e),
	Unbox: e => new UnboxError(e)
};
