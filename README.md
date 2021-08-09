# Lazycrate

[![Build Status](https://img.shields.io/travis/com/PotatoParser/lazycrate?style=for-the-badge)](https://travis-ci.com/PotatoParser/lazycrate)[![Coverage](https://img.shields.io/coveralls/github/PotatoParser/lazycrate?style=for-the-badge)](https://coveralls.io/github/PotatoParser/lazycrate)[![Node LTS](https://img.shields.io/badge/Node-LTS-brightgreen.svg?style=for-the-badge)](https://nodejs.org/dist/latest-v14.x/)[![Node v15+](https://img.shields.io/badge/Node-v15+-brightgreen.svg?style=for-the-badge)](https://nodejs.org/dist/latest-v15.x/)

Lazily and easily serialize and deserialize variables

```javascript
const lazycrate = require('laycrate').sync;	// Use the synchronous version

function stringifiedClass() {

	// Test class
	class TestClass {
		constructor() {
			this.creationTime = new Date();
		}
		getCreationTime() {
			return this.creationTime;
		}
	}

	const test = new TestClass();

	return lazycrate.box(test);						// Convert our object into a string!

}

const stringClass = stringifiedClass();				// Our class is now converted into a string

console.log(stringClass);

const revivedClass = lazycrate.unbox(stringClass);	// Convert the string back into the class!

console.log(revivedClass.getCreationTime().toLocaleDateString());		// This works!
```

## Installation

`npm install lazycrate`

## Features

- Serialize and deserialize variables
- Accepts **primitives** and **objects**
- Compress serialized objects
- Synchronous and asynchronous boxing/unboxing

## Synchronous

### `lazycrate.sync.box(object)`

- `object`: `<Variable>` Variable to be serialized
- Returns: `<String>` Serialized version of the variable. Can be compressed.

### `lazycrate.sync.unbox(string)`

- `string`: `<String>` | `<Buffer>` Serialized content
- Returns: `<Variable>` Deserialized variable created from boxing

### Example:

```javascript
const { unbox, box } = require('lazycrate').sync;
let unserialized = {
    content: 'Hello World'
}
let serialized = box(unserialized);
console.log(unbox(serialized));
/*
	{
		content: 'Hello World'
	}
*/
```

## Asynchronous

For the most part, the asynchronous code is available due to the usage of [Brotli compression](https://nodejs.org/api/zlib.html#zlib_zlib_brotlicompress_buffer_options_callback).

### `lazycrate.box(object)`

- `object`: `<Variable>` Variable to be serialized
- Returns: `<String>` Serialized version of the variable. Can be compressed.

### `lazycrate.unbox(string)`

- `string`: `<String>` | `<Buffer>` Serialized content
- Returns: `<Variable>` Deserialized variable created from boxing

### Example:

```javascript
const { unbox, box } = require('lazycrate');
let unserialized = {
    content: 'Hello World'
}
(async function(){
    let serialized = await box(unserialized);
    console.log(await unbox(serialized));
    /*
        {
            content: 'Hello World'
        }
    */
})();
```

