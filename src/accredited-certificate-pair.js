const PrivateAccreditedCertificate = require('./private-accredited-certificate.js');
const PublicAccreditedCertificate = require('./public-accredited-certificate.js');

module.exports = class AccreditedCertificatePair {
	constructor(publicCertificate, privateCertificate, password) {
		if (!(publicCertificate instanceof PublicAccreditedCertificate)) {
			publicCertificate = new PublicAccreditedCertificate(publicCertificate);
		}

		this.publicCertificate = publicCertificate;

		if (!(privateCertificate instanceof PrivateAccreditedCertificate)) {
			privateCertificate = new PrivateAccreditedCertificate(privateCertificate, password);
		}

		this.privateCertificate = privateCertificate;
	}

	/** @returns {boolean} */
	verifyVirtualID(idNumber) {
		return this.publicCertificate.virtualID.equals(this.privateCertificate.calculateVirtualID(this.publicCertificate.hashAlgorithm, idNumber));
	}
};
