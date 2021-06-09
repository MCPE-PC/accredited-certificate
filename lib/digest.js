const crypto = require('crypto');

const hashes = new Map(); // https://www.rootca.or.kr/kcac/down/TechSpec/2.2-KCAC.TS.HASH.pdf

for (const algorithm of [['sha1', 'SHA-1'], ['sha224', 'SHA-224', 4], ['sha256', 'SHA-256', 1], ['sha384', 'SHA-384', 2], ['sha512', 'SHA-512', 3], ['sha512-224', 'SHA-512/224', 5], ['sha512-256', 'SHA-512/256', 6]]) {
	const hash = crypto.createHash(algorithm[0]);

	for (const alias of algorithm) {
		hashes.set(alias, hash);
	}
}

// TODO: Support `has160` hash

function digest(algorithm, input, inputEncoding) {
	const hash = getHash(algorithm);

	if (Array.isArray(input) && !inputEncoding) {
		for (const data of input) {
			hash.update(data);
		}
	} else {
		hash.update(input, inputEncoding);
	}

	return hash.digest();
}

/** @returns {crypto.Hash} */
function getHash(algorithm, options) {
	return hashes.has(algorithm) ? hashes.get(algorithm).copy(options) : crypto.createHash(algorithm, options);
}

function pbkdf1(password, salt, iterations, keylen) {
	let derivedKey = digest('sha1', [password, salt]);

	for (let i = 1; i < iterations; i++) {
		const oldBuffer = derivedKey;

		derivedKey = digest('sha1', derivedKey);

		oldBuffer.fill(0);
	}

	return derivedKey.subarray(0, keylen + 1);
}

module.exports = digest;
module.exports.getHash = getHash;
module.exports.pbkdf1 = pbkdf1;
