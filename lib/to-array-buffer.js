/** @returns {ArrayBuffer} */
function toArrayBuffer(string) {
	if (string instanceof ArrayBuffer) {
		return string;
	}

	if (!ArrayBuffer.isView(string)) {
		string = Buffer.from(string);
	}

	return string.byteLength === string.buffer.byteLength ? string.buffer : string.buffer.slice(string.byteOffset, string.byteOffset + string.byteLength);
}

module.exports = toArrayBuffer;
