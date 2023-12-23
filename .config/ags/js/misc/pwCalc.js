import GLib from "gi://GLib";

function hex2bytearray(hex) {
  var array = hex.match(/.{2}/g);
  var bytes = new Uint8Array(20);
  for (var i = 0; i < array.length; i++) bytes[i] = parseInt(array[i], 16);
  return bytes;
}

function sha1bytes(text) {
  var c = new GLib.Checksum(GLib.ChecksumType.SHA1);
  c.update(text);
  //return c.get_digest();
  return hex2bytearray(c.get_string());
}

export const pwCalc = (secret, domain, length) => {
  // secret = secret ? secret.toString() : " "
  // domain = domain ? domain.toString() : " "

  const text = (secret ? secret.toString() : " ") +
    (domain ? domain.toString() : " ");
  const sha1 = sha1bytes(text);
  const base64 = GLib.base64_encode(sha1);
  return base64.substring(0, length);
};
