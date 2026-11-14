import {
  randomBytes,
  scrypt,
  type ScryptOptions,
  timingSafeEqual,
} from 'node:crypto';

// Better Auth와 같은 scrypt 파라미터다. 해시 하나에 약 128 × N × r = 32MiB를 쓴다.
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 16,
  p: 1,
  // Node의 기본 메모리 한도(32MiB)에 딱 걸려 오류가 나므로 두 배로 넉넉히 준다.
  maxmem: 128 * 16384 * 16 * 2,
} satisfies ScryptOptions;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/** 비밀번호를 `솔트:키`(hex) 형식의 scrypt 해시로 만든다. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const key = await deriveKey({ password, salt });
  return `${salt}:${key.toString('hex')}`;
}

/** 비밀번호가 해시와 맞는지 상수 시간으로 비교한다. */
export async function verifyPassword({
  password,
  hash,
}: {
  password: string;
  hash: string;
}): Promise<boolean> {
  const [salt, keyHex] = hash.split(':');
  if (!salt || !keyHex) {
    return false;
  }
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await deriveKey({ password, salt });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function deriveKey({
  password,
  salt,
}: {
  password: string;
  salt: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // 같은 글자를 다른 코드 포인트로 입력해도(예: 조합형 한글) 같은 비밀번호로 보도록 정규화한다(Better Auth와 같음).
    scrypt(
      password.normalize('NFKC'),
      salt,
      KEY_LENGTH,
      SCRYPT_OPTIONS,
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}
