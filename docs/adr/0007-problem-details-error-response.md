# API 오류 응답은 RFC 9457 Problem Details로 통일한다

API의 모든 오류 응답은 `application/problem+json`으로 보내고, 표준 필드(`type`, `title`, `status`, `detail`)에 앱 오류 코드 `code`를 더한다. 검증 오류에는 필드별 `errors`를 붙인다. 직접 만든 `{ code, message }` 형식도 가능했지만, 표준을 따르면 형식을 설명할 근거가 문서로 있고 1.4 인증과 이후 결제 오류도 같은 틀로 받을 수 있다. 스토어와 어드민의 오류 처리가 모두 이 형식에 의존하므로, 나중에 바꾸면 클라이언트 전체를 고쳐야 한다.
