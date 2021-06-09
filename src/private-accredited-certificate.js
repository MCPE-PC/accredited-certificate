const asn1js = require('asn1js');
const crypto = require('crypto');
const digest = require('../lib/digest.js');
const toArrayBuffer = require('../lib/to-array-buffer.js');

const fixedInitialVector = Buffer.from([0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35]);

module.exports = class PrivateAccreditedCertificate { // https://www.rootca.or.kr/kcac/down/TechSpec/2.3-KCAC.TS.ENC.pdf
	constructor(derBuffer, password, flushRiskyKeys = true) {
		const asn1 = asn1js.fromBER(toArrayBuffer(derBuffer));
		this.asn1 = asn1.result;

		if (asn1.offset === -1) {
			throw new RangeError(this.asn1.error);
		}

		this.derivedKey = digest.pbkdf1(password, this.salt, this.iterationsCount, 20);

		const decipher = crypto.createDecipheriv('seed-cbc', this.key, this.initialVector);
		const decryptedKey = Buffer.concat([decipher.update(this.encryptedData), decipher.final()]);

		if (flushRiskyKeys) {
			this.asn1 = null;
			this.derivedKey = null;
		}

		const decryptedAsn1 = asn1js.fromBER(toArrayBuffer(decryptedKey));
		this.decryptedAsn1 = decryptedAsn1.result;

		if (decryptedAsn1.offset === -1) {
			throw new TypeError(this.decryptedAsn1.error);
		}

		this.decryptedNativePrivateKey = crypto.createPrivateKey({
			key: decryptedKey,
			format: 'der',
			type: 'pkcs8'
		});
	}

	calculateVirtualID(hashAlgorithm, idNumber) {
		const sequence = new asn1js.Sequence();

		sequence.valueBlock.value.push(new asn1js.PrintableString({value: idNumber}), this.random);

		return digest(hashAlgorithm, digest(hashAlgorithm, Buffer.from(sequence.toBER())));
	}

	/** @returns {Array} */
	get encryptionAlgorithm() {
		return this.asn1.valueBlock.value[0].valueBlock.value;
	}

	get cipherAlgorithm() {
		const algorithm = this.encryptionAlgorithm[0].valueBlock.value[4].valueDec;

		if (algorithm === 4) {
			return 'seed-cbc';
		}

		if (algorithm === 15) {
			return 'seed-cbc-with-SHA1';
		}

		throw new RangeError('Unknown cipher algorithm');
	}

	get salt() { // TODO: 8 bytes
		return Buffer.from(this.encryptionAlgorithm[1].valueBlock.value[0].valueBlock.valueHex, 'hex');
	}

	/** @returns {number} */
	get iterationsCount() { // TODO: 2 bytes
		return this.encryptionAlgorithm[1].valueBlock.value[1].valueBlock.valueDec;
	}

	get encryptedData() {
		return Buffer.from(this.asn1.valueBlock.value[1].valueBlock.valueHex, 'hex');
	}

	get key() {
		return this.derivedKey.subarray(0, 16);
	}

	get derivedInitialVector() { // TODO: 4 bytes
		if (this.cipherAlgorithm !== 'seed-cbc-with-SHA1') {
			throw new RangeError('Should not use DIV unnecessarily');
		}

		return digest('sha1', this.derivedKey.slice(16));
	}

	get initialVector() {
		return this.cipherAlgorithm === 'seed-cbc' ? fixedInitialVector : this.derivedInitialVector.slice(0, 16);
	}

	/** @returns {Array} */
	get attributes() {
		return this.decryptedAsn1.valueBlock.value[3].valueBlock.value;
	}

	/** @returns {asn1js.BitString} */
	get random() {
		return this.attributes[0].valueBlock.value[1].valueBlock.value[0];
	}
};
