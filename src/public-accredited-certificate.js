const asn1js = require('asn1js');
const crypto = require('crypto');
const pkijs = require('pkijs');
const toArrayBuffer = require('../lib/to-array-buffer.js');

module.exports = class PublicAccreditedCertificate { // https://www.rootca.or.kr/kcac/down/TechSpec/1.1-KCAC.TS.CERTPROF.pdf
	constructor(derBuffer) {
		const asn1 = asn1js.fromBER(toArrayBuffer(derBuffer));
		this.asn1 = asn1.result;

		if (asn1.offset === -1) {
			throw new RangeError(this.asn1.error);
		}

		this.nativeCertificate = new crypto.X509Certificate(derBuffer);

		this.pkijsX509 = new pkijs.Certificate({schema: this.asn1});
		if (this.pkijsX509.version !== 2) {
			throw new TypeError('Only version 3 accredited certificates are allowed');
		}

		// TODO: https://www.rootca.or.kr/kcac/down/TechSpec/1.1-KCAC.TS.CERTPROF.pdf `extensions` 필드 처리
	}

	/** @returns {Array} */
	get policyQualifiers() {
		return searchByOID(this.pkijsX509.extensions, '2.5.29.32', 'extnID').parsedValue.certificatePolicies[0].policyQualifiers;
	}

	/** @returns {string} */
	get cpsURI() {
		return searchByOID(this.policyQualifiers, '1.3.6.1.5.5.7.2.1', 'policyQualifierId').qualifier.valueBlock.value;
	}

	get userNotice() {
		const userNotice = [];

		for (const string of searchByOID(this.policyQualifiers, '1.3.6.1.5.5.7.2.2', 'policyQualifierId').qualifier.valueBlock.value) {
			userNotice.push(string.valueBlock.value);
		}

		return userNotice;
	}

	get explicitTexts() {
		const explicitTexts = [];

		for (const userNotice of this.userNotice) {
			if (typeof userNotice.valueBlock.value === 'string') {
				explicitTexts.push(userNotice.valueBlock.value);
			}
		}

		return explicitTexts;
	}

	/** @returns {Array} */
	get altNames() {
		return searchByOID(this.pkijsX509.extensions, '2.5.29.17', 'extnID').parsedValue.altNames;
	}

	/** @returns {string} */
	get rfc822Name() {
		return searchByOID(this.altNames, 1).value;
	}

	/** @returns {string} */
	get realName() { // TODO
		return this.altNames[1].value.valueBlock.value[1].valueBlock.value[0].valueBlock.value.valueBlock.value;
	}

	get hashAlgorithm() { // TODO
		return 'SHA-256';
	}

	get virtualID() { // TODO
		return Buffer.from(this.altNames[1].value.valueBlock.value[1].valueBlock.value[0].valueBlock.value[1].valueBlock.value[0].valueBlock.value[1].valueBlock.value[1].valueBlock.value[0].valueBlock.valueHex, 'hex');
	}
};

function searchByOID(arrayOfObjects, oid, keyOfOID = 'type') {
	for (const object of arrayOfObjects) {
		if (object[keyOfOID] === oid) {
			return object;
		}
	}
}
