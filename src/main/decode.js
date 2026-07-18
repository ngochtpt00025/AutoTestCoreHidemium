/**
 * Port tu C#: Encode_Tool_Hex2bin/Form1.cs
 *
 * Encode:  hex(input) -> cat_and_ChuyenDoiChuoi_Encode(hex, n)
 * Decode:  cat_and_ChuyenDoiChuoi_Decode(input, n) -> hex2text
 *
 * Quy tac decode (giong cat_and_ChuyenDoiChuoi_Decode):
 *   lay n ky tu dau -> dao nguoc -> noi vao CUOI chuoi -> cat bo n ky tu dau
 */

const DEFAULT_SO_KY_TU = 7;

/** C#: DecodeBinToHex - hex string -> text */
function hexToText(hex, encoding = 'utf8') {
  const clean = String(hex).replace(/-/g, '').replace(/[\r\n\s]/g, '');
  const even = clean.length % 2 === 0 ? clean : clean.slice(0, -1);
  return Buffer.from(even, 'hex').toString(encoding);
}

/** C#: EndcodeBin2hex - text -> hex string */
function textToHex(text, encoding = 'utf8') {
  return Buffer.from(String(text), encoding).toString('hex');
}

/** C#: cat_and_ChuyenDoiChuoi_Decode */
function unshuffle(input, soKyTu = DEFAULT_SO_KY_TU) {
  const s = String(input);
  if (s.length < soKyTu) return s;
  const head = s.slice(0, soKyTu);
  const reversedHead = head.split('').reverse().join('');
  return s.slice(soKyTu) + reversedHead;
}

/** C#: cat_and_ChuyenDoiChuoi_Encode */
function shuffle(input, soKyTu = DEFAULT_SO_KY_TU) {
  const s = String(input);
  if (s.length < soKyTu) return s;
  const tail = s.slice(s.length - soKyTu);
  const reversedTail = tail.split('').reverse().join('');
  return reversedTail + s.slice(0, s.length - soKyTu);
}

/** Decode 1 dong (1 line hex da shuffle) -> text goc */
function decodeLine(line, soKyTu = DEFAULT_SO_KY_TU) {
  return hexToText(unshuffle(line.trim(), soKyTu));
}

/** Encode 1 dong text -> hex da shuffle */
function encodeLine(line, soKyTu = DEFAULT_SO_KY_TU) {
  return shuffle(textToHex(line), soKyTu);
}

/**
 * Decode toan bo noi dung file config.hidemium (moi dong 1 record).
 * @returns {string} noi dung dang plain text, moi dong 1 "key:value"
 */
function decodeContent(content, soKyTu = DEFAULT_SO_KY_TU) {
  return String(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      try {
        return decodeLine(line, soKyTu);
      } catch {
        return ''; // dong hong thi bo qua, khong lam chet ca file
      }
    })
    .filter((line) => line.length > 0)
    .join('\n');
}

module.exports = {
  DEFAULT_SO_KY_TU,
  hexToText,
  textToHex,
  shuffle,
  unshuffle,
  decodeLine,
  encodeLine,
  decodeContent,
};
