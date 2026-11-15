import {
  createHash,
  createHmac,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

const TOKEN_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// 영문 대소문자와 숫자 62종에서 32자를 뽑아 약 190비트다(Better Auth와 같음).
const TOKEN_LENGTH = 32;

/** 세션 토큰을 새로 만든다. randomInt는 모듈로 편향 없이 고르게 뽑는다. */
export function createSessionToken(): string {
  return Array.from(
    { length: TOKEN_LENGTH },
    () => TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)],
  ).join('');
}

/** DB에 저장하고 조회할 때 쓰는 토큰의 SHA-256 해시(hex)다. DB가 유출돼도 원문을 알 수 없다. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 쿠키에 담을 `토큰.서명` 값을 만든다. 서명은 HMAC-SHA256의 base64다. */
export function signSessionToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}): string {
  return `${token}.${getSignature({ token, secret })}`;
}

/** 쿠키 값의 서명이 맞으면 토큰을, 아니면 null을 돌려준다. 서명이 틀린 쿠키는 DB를 조회하기 전에 거른다. */
export function readSignedSessionToken({
  value,
  secret,
}: {
  value: string;
  secret: string;
}): string | null {
  const separator = value.lastIndexOf('.');
  if (separator <= 0) {
    return null;
  }
  const token = value.slice(0, separator);
  const signature = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(getSignature({ token, secret }));
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(signature, expected)
  ) {
    return null;
  }
  return token;
}

function getSignature({
  token,
  secret,
}: {
  token: string;
  secret: string;
}): string {
  return createHmac('sha256', secret).update(token).digest('base64');
}
