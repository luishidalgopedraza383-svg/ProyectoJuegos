'use strict';

const { randomBytes } = require('crypto');

// Sin 0/O ni 1/I para que la clave sea fácil de transcribir al canjearla.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GROUP_LENGTH = 5;
const GROUPS = 3;

const DIGITAL_KEY_PATTERN = /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

/** Devuelve una clave con formato XXXXX-XXXXX-XXXXX. */
const generateDigitalKey = () => {
  const bytes = randomBytes(GROUP_LENGTH * GROUPS);
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]);
  return Array.from({ length: GROUPS }, (_, index) =>
    chars.slice(index * GROUP_LENGTH, (index + 1) * GROUP_LENGTH).join('')).join('-');
};

module.exports = { generateDigitalKey, DIGITAL_KEY_PATTERN };
