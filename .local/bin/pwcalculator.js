#!/bin/gjs

const GLib = imports.gi.GLib;

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

function sha1(secret, domain, length) {
  if (secret == "" || domain == "") return "";
  var text = secret + domain;
  var sha1 = sha1bytes(text);
  var base64 = GLib.base64_encode(sha1);
  return base64.substring(0, length);
}

// if (ARGV.length === 0) {
//   print("No arguments provided.");
// } else {
//   // Iterate through each command-line argument
//   for (let i = 0; i < ARGV.length; i++) {
//     let arg = ARGV[i];
//     print("Argument " + i + ": '" + arg + "'");
//   }
// }

// print(ARGV[-1]);
//
// print(sha1bytes(ARGV[1]));
// print(sha1bytes(ARGV[2]));

print(sha1(ARGV[0], ARGV[1], 16));
