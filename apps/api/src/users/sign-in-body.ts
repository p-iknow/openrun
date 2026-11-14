import { z } from 'zod';

const EMAIL_MESSAGE = '이메일을 입력해야 합니다.';
const PASSWORD_MESSAGE = '비밀번호를 입력해야 합니다.';

// POST /auth/sign-in의 본문. 이 스키마 하나에서 검증, OpenAPI 요청 본문, 타입이 모두 나온다.
// 이메일은 가입할 때처럼 앞뒤 공백을 지우고 소문자로 바꿔 비교한다.
// 형식 검사는 하지 않는다. 형식이 틀린 이메일도 없는 이메일과 같은 401로 응답하면 된다.
export const signInBodySchema = z.object({
  email: z
    .string(EMAIL_MESSAGE)
    .trim()
    .toLowerCase()
    .min(1, EMAIL_MESSAGE)
    .meta({ description: '이메일', example: 'user@example.com' }),
  password: z
    .string(PASSWORD_MESSAGE)
    .min(1, PASSWORD_MESSAGE)
    .meta({ description: '비밀번호' }),
  rememberMe: z.boolean('true나 false여야 합니다.').meta({
    description:
      '로그인 상태 유지. 켜면 세션이 7일 동안 유지되고 쓰는 동안 연장된다. 끄면 1일 뒤 끝나고 브라우저를 닫으면 쿠키가 사라진다.',
  }),
});

export type SignInBody = z.infer<typeof signInBodySchema>;
