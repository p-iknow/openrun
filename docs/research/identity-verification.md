# 휴대폰 본인인증 연동 가능성 조사

조사일은 2026-11-14이다. 질문은 사업자등록이 없는 개인이 비상업 포트폴리오(가상 예매 사이트, 로컬 실행 후 소형 VPS 데모)에서 휴대폰 본인인증(PASS, NICE, KCB, 다날, KG이니시스 통합인증 등)을 테스트 모드로라도 붙일 수 있는가이다. 대안으로 SMS OTP 휴대폰 번호 확인도 살폈다.

## 표기와 방법

각 항목은 **공식 문서**(사업자 자신의 개발자 문서, 헬프센터, 약관, 요금 페이지), **소스**(사업자가 배포한 샘플 코드), **관찰**(실제 서비스 화면), **추론**으로 구분한다. 검색 엔진 요약은 근거로 쓰지 않았고, 원문을 열어 확인한 것만 적었다. 원문을 확인하지 못한 것은 "확인하지 못함"으로 적는다.

PortOne 문서는 공개 저장소 [portone-io/developers.portone.io](https://github.com/portone-io/developers.portone.io)의 MDX 원문을 직접 grep했다. KG이니시스 샘플은 [통합인증 개발가이드](https://manual.inicis.com/sa/auth.html)의 공식 다운로드(`SaSample.zip`)를 받아 읽기만 했다(실행하지 않음). 예매 서비스 FAQ는 브라우저로 열어 읽었다.

## 결론 요약

- **계약 없이 진짜 본인확인 결과(CI/DI, 실명)를 받는 경로는 사실상 없다.** PortOne은 본인인증만 쓸 때도 PG 계약이 필수라고 하고, 다날은 본인인증용 테스트 연동정보 자체를 주지 않는다(Q1). KG이니시스 통합인증 계약서는 사업자(개인/법인/비영리법인)만 신청 대상으로 받는다(Q2).
- **예외적으로 "샘플용 테스트 MID"는 공개돼 있다.** KG이니시스 공식 샘플에 테스트 MID `INIiasTest`와 그 apiKey가 들어 있다(Q2, 소스). 다만 테스트 MID가 어떤 데이터를 돌려주는지, 개인 포트폴리오가 이를 계속 써도 되는지는 공식 문서에 없다. 운영 엔드포인트를 그대로 쓰므로 실제 인증서로 실제 인증을 하는 것으로 **추론**한다.
- **토스인증은 계약 전 테스트 환경을 공식 제공하고, 가상 인물 데이터를 돌려준다(Q4).** 하지만 테스트 자격증명은 이메일 요청으로 개별 발급되며, 개인에게도 주는지는 확인하지 못했다.
- **SMS OTP(휴대폰 번호 소유 확인)는 개인도 실제로 붙일 수 있다(Q5).** 솔라피는 개인 계정을 받고, 본인 명의 휴대폰을 문자 본인인증으로 발신번호에 등록할 수 있다(SMS 18원/건). NHN Cloud SMS는 개인 회원을 받지 않는다. 알리고는 과금과 실제 발송만 빼는 `testmode_yn` 파라미터가 있다.
- **실제 예매 서비스는 "가입은 가볍게, 예매 전에 본인인증"이다(Q6).** YES24는 본인인증한 ID로만 예매할 수 있고, NOL은 본인인증이 1년간 유효하며 상품 상세의 [인증 후 예매하기]로 진행한다. 멜론은 회원정보의 휴대폰 번호를 "연락처" 개념으로 보고 인증번호만으로 등록하며, 19금 공연 예매 때 본인 명의 휴대폰 성인인증을 한다.
- **추천(추론):** (B) SMS OTP를 `SmsSender` 경계 뒤에 두고, 개발 환경에서는 가짜 발송기(Mailpit처럼 보낸 문자를 화면/로그로 보는 것)를, 데모에서는 솔라피를 쓴다. 법적 본인확인(CI/DI)은 범위에서 빼되, 모델은 "본인인증 완료 시각 + 유효기간" 같은 실제 모양으로 두고 시드나 가짜 인증으로 채운다. 이 차이는 스펙이나 ADR에 적는다.

## Q1. PortOne(포트원) 본인인증

**공식 문서:**

- 관리자 콘솔 가입은 무료이고 계약이 필요 없다. "포트원 관리자 콘솔은 별도 계약 없이 무료로 회원가입이 가능합니다." 전자결제 신청 전에도 "테스트 환경으로 채널 추가하여 테스트를 진행"할 수 있다([결제대행사 채널 설정하기](https://developers.portone.io/opi/ko/integration/ready/readme?v=v2)).
- 테스트 채널을 만들 때 채널 속성으로 `본인인증`을 고를 수 있다. 상점 아이디는 "테스트 용도로 발급 받은 `상점 아이디`를 직접 입력하시거나, 제공되는 다른 공용 상점아이디를 선택"한다. 공용 테스트 채널은 "공용 테스트 채널이 제공되는 결제대행사의 경우" 자동으로 표시된다(같은 문서). 어느 PG가 본인인증용 공용 테스트 채널을 주는지는 문서에 없다.
- 본인인증 채널 속성은 다날과 KG이니시스를 고를 때만 활성화된다([콘솔 릴리스 노트 2023-04-24](https://github.com/portone-io/developers.portone.io/blob/main/src/routes/(root)/release-notes/(note)/console/2023-04-24.mdx)). V2 문서가 지원한다고 적은 본인인증은 다날 휴대폰 본인인증, KCP 휴대폰 본인인증, KG이니시스 통합인증이다([본인인증 연동하기 V2](https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2)).
- PG별 연동 정보는 모두 "계약 완료 후" 받은 값을 넣으라고 한다. 다날은 "계약 완료 후 다날로부터 전달받은 [CPID], [CPPWD], [상품코드]", 이니시스 통합인증은 "계약 완료 후 KG이니시스로부터 전달받은 [MID]와 [apikey]"다(채널 설정 문서 원문 `integration/ready/readme.mdx`).
- 헬프센터: "단독으로 사용하실 때에도 결제대행사와의 계약은 필수입니다." 다날은 "다날 SMS 본인인증은 PG사 정책상 테스트환경 지원이 불가하여 실제 PG사와 계약을 맺으신 후 실제 연동 KEY로 연동 테스트가 가능합니다."([본인인증 - PortOne 헬프센터](https://help.portone.io/content/identity-verification)). 다날 채널 안내에도 "다날 정책상 본인인증 테스트 연동정보가 제공되지 않습니다"라고 있다([다날 채널설정방법](https://help.portone.io/content/danal)).
- 다날 결과의 생년월일, 통신사, 전화번호는 "추가 계약 후 제공"이다([본인인증 연동하기 V2](https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2)).

**확인하지 못함:** KCP와 이니시스 통합인증의 PortOne 테스트 채널 제공 여부, 테스트 응답이 가짜 데이터인지. 문서와 헬프센터 어디에도 적혀 있지 않다. 콘솔에 로그인해 테스트 채널 화면을 보면 확인할 수 있으나, 계정 생성은 하지 않았다.

**판단:** 콘솔과 SDK 연동 코드는 계약 없이 짤 수 있지만, 다날은 테스트로 인증을 끝까지 돌릴 수 없다. 나머지도 계약 전 실제 동작을 확인할 공식 근거가 없다.

## Q2. KG이니시스 통합인증 / 간편인증

**공식 문서** ([통합인증서비스 신청 페이지](https://sign-service.inicis.com/)):

- 신청서의 사업자 유형은 개인 사업자, 법인 사업자, 비영리법인 셋뿐이고, 사업자등록번호와 "사업자등록증상 주소"를 받는다. 계약서를 우편으로 보내야 한다.
- 요금은 인증 성공 건당이고 금액은 공개하지 않는다. 직접 연동은 신청 후 견적을 준다.
- 신청 페이지에 테스트 MID나 샌드박스 안내는 없다.

**공식 문서** ([통합인증 개발가이드](https://manual.inicis.com/sa/auth.html)):

- 연동 준비 항목에서 MID는 "계약 완료 여부, 사용 가능 인증서 등은 계약담당자 문의", apikey는 "통합인증 계약 시 안내받은 apikey"다.
- 요청 URL은 간편인증·전자서명이 `https://sa.inicis.com/auth`, 본인확인이 `https://sa.inicis.com/id/auth`다. 별도 테스트 호스트는 적혀 있지 않다.
- Quick Guide는 "샘플 다운로드 → 리턴 URL 수정 → 테스트 실행 및 결과확인 → 실제 연동진행" 순서다.

**소스** (공식 샘플 `SaSample.zip`, `PHP/request.php`):

```php
$mid ='INIiasTest';								// 테스트 MID 입니다. 계약한 상점 MID 로 변경 필요
$apiKey ='TGdxb2l3enJDWFRTbTgvREU3MGYwUT09';	// 테스트 MID 에 대한 apiKey
```

같은 값을 그누보드7의 이니시스 본인확인 플러그인도 테스트 모드 기본값으로 쓴다([README](https://github.com/gnuboard/g7-plugin-sirsoft-verification_kginicis)).

**추론:** 테스트 MID는 운영과 같은 `sa.inicis.com`을 부르고 결과조회 URL도 `kssa.inicis.com`/`fcsa.inicis.com`이므로, 가상 응답이 아니라 테스터가 자기 PASS·카카오 등 실제 인증서로 실제 인증을 하는 방식으로 보인다. 그렇다면 결과에 테스터 본인의 실명·생년월일·CI가 담긴다. 테스트 MID를 공개 데모 사이트에 계속 쓰는 것을 허용하는지는 어디에도 없다. 공개 데모에서 남의 실제 개인정보를 받는 것은 피해야 한다.

## Q3. NICE평가정보, KCB, 다날 직접 계약

- **NICE:** NICE 공식 사이트에서 신청 요건을 확인하지 못했다. 제3자(코드엠)가 배포한 NICE아이디 제휴서비스 신청서 양식에는 사업자등록증 사본과 직인 날인 신청서가 제출 서류로 있다([신청서 양식](https://www.codemshop.com/wp-content/uploads/2026/05/NICE아이디제휴서비스신청서코드엠_2026_v1.3_.docx), 2차 자료).
- **KCB, 다날:** 공식 신청 요건 페이지를 찾지 못했다.
- 공개 샌드박스는 세 곳 모두 찾지 못했다.

**추론:** 계약서에 직인과 사업자등록증을 요구하는 구조이고, PortOne과 이니시스도 사업자 계약을 전제로 하므로 개인이 직접 계약할 가능성은 낮다. 공식 근거로 확정하지는 못했다.

## Q4. 토스

- **토스페이먼츠:** 결제사 쪽에서 가맹점용 휴대폰 본인인증 API를 찾지 못했다. 토스페이먼츠 블로그의 "휴대폰본인인증(CI인증)"은 지급대행 셀러가 거치는 절차다([셀러 휴대폰본인인증 가이드](https://www.tosspayments.com/blog/articles/54697)).
- **토스인증(별도 상품):** 상품은 본인확인(CI/DI), 간편인증, 전자서명, 마이데이터 통합인증이다([토스인증](https://toss.im/tosscert)).

**공식 문서** ([토스인증 테스트 가이드](https://toss.im/tosscert/docs/guides/test)):

- "계약이 완료되지 않아도 토스인증 테스트 환경에서 인증 연동을 진행해 볼 수 있습니다."
- 테스트 Client ID/Secret은 화면에 공개하지 않고 이메일(cert.support@toss.im)로 요청해 개별 발급받는다. 테스트 자격증명은 `test_`로 시작한다.
- "테스트 환경에서는 안전을 위해 실제 사용자의 정보가 아닌 토스가 생성한 가상 인물의 고유한 개인정보를 제공합니다." 테스트 환경에서는 인증 요금이 없다.
- 연동 방식은 OAuth 2.0 Client Credentials다([공통 가이드](https://toss.im/tosscert/docs/guides/common)).

**확인하지 못함:** 개인(비사업자)에게도 테스트 자격증명을 주는지. 문서는 사업자 요건을 말하지 않지만, 이메일 요청 과정에서 회사 정보를 묻는지는 알 수 없다. 운영 계약은 사업자 대상으로 **추론**한다.

**판단:** 조사한 곳 중 "계약 없이, 가상 데이터로" 끝까지 돌려볼 수 있다고 공식 문서가 밝힌 곳은 토스인증 테스트 환경뿐이다. 다만 포트폴리오에서 쓰려면 자격증명을 받아야 하고, 이것은 사용자 본인이 문의해야 한다. 그리고 테스트 환경일 뿐이라 실제 데모 사용자에게 열 수는 없다.

## Q5. 대안: SMS OTP 휴대폰 번호 확인

법적 본인확인이 아니라 "이 번호를 지금 가진 사람"만 확인한다. 실명, 생년월일, CI/DI는 얻지 못한다.

### 국내 발신 규칙

- 국내 문자 발신번호는 사전 등록한 번호만 쓸 수 있다(각 사업자 문서 공통. 예: 알리고 "발신번호는 사이트내에서 미리 등록된 번호만 사용하실 수 있습니다." [API 스펙](https://smartsms.aligo.in/admin/api/spec.html)).
- 2026-11-11부터 문자 전송자격인증제가 시행됐다. 솔라피 공지: "「전기통신사업법」 개정과 「전송자격인증기준 등에 관한 고시」 시행으로 문자 전송자격인증제가 도입되었습니다." 개인·개인사업자는 무선 번호 최대 3개, 유선 번호 최대 5개를 등록할 수 있고, 개인 계정이 API로 보내려면 허용 IP를 하나 이상 등록해야 한다([솔라피 공지](https://solapi.com/notices/20261109-230704)).

### 사업자별 비교

| 사업자 | 개인 사용 | 발신번호 등록 | 요금 | 테스트 수단 |
|---|---|---|---|---|
| 솔라피 | 가능. 개인 계정은 1인 전용, 하루 50~500건, 발신번호 5개([시작 가이드](https://solapi.com/guides/start)) | 본인 명의 번호는 "문자본인인증을 통해 등록 및 사용 가능"([발신번호 FAQ](https://solapi.com/guides/senderid-faq)) | SMS 18원, LMS 45원(부가세 별도)([요금](https://solapi.com/pricing)) | 가입 시 300P 지급. 체험 계정은 실제 발송 불가([시작 가이드](https://solapi.com/guides/start)). 별도 테스트 모드는 확인하지 못함 |
| NHN Cloud SMS | 불가. "개인 회원은 서비스를 이용할 수 없습니다."(2023-12-15 이후 가입)([콘솔 가이드](https://docs.nhncloud.com/ko/Notification/SMS/ko/console-guide/)) | 사업자등록증, 재직증명서 등 | 확인하지 못함 | 확인하지 못함 |
| 네이버 클라우드 SENS | 확인하지 못함 | "서류 인증을 통해 등록", 승인 영업일 3~4일([발신번호 가이드](https://guide.ncloud-docs.com/docs/sens-callingno), 문서가 오래됐다고 표시됨) | 확인하지 못함 | 확인하지 못함 |
| 알리고 | 확인하지 못함 | 사이트에 미리 등록한 번호만 | 공개 단가 확인하지 못함 | `testmode_yn=Y`: "과금프로세스와 실제문자 전송을 제외한 나머지가 실제와 동일하게 동작"([API 스펙](https://smartsms.aligo.in/admin/api/spec.html)) |
| Twilio Verify | 가능(해외 계정) | 국내 발신번호 등록 없음. 숫자 발신자만 되고 006/009 접두가 붙으며 "[국제발신]" 표시([KR SMS 가이드라인](https://www.twilio.com/en-us/guidelines/kr/sms)) | 인증 성공당 $0.05 + SMS 채널 요금([Verify 요금](https://www.twilio.com/en-us/verify/pricing)), 한국행 SMS $0.0524/세그먼트([SMS 요금](https://www.twilio.com/en-us/sms/pricing/kr)) | 무료 체험, 카드 없이 시작([Verify 요금](https://www.twilio.com/en-us/verify/pricing)) |

**판단:** 개인이 국내 발신으로 붙이기에는 솔라피가 요건이 가장 가볍다(본인 명의 휴대폰 문자 인증, 서류 없음). 단, 솔라피 FAQ는 개인 명의 번호가 이통사 "번호도용문자 차단 서비스"에 가입돼 있으면 발송이 실패할 수 있다고 한다(검색 요약, 원문 문구는 직접 확인하지 못함). API 발송에 허용 IP가 필요하므로 고정 IP가 있는 VPS에서 보내는 편이 맞다(추론). Twilio는 등록 절차가 없지만 수신자에게 국제발신으로 보이고 건당 비용이 더 크다.

## Q6. 실제 예매 서비스의 본인인증

### YES24 티켓 (관찰, [FAQ](https://ticket.yes24.com/UserGuide/FAQ))

- "공연 예매는 본인 인증된 ID로만 예매 가능합니다." 비회원과 간편 가입 회원은 예매할 수 없고, 예매 전 휴대폰 또는 I-PIN으로 본인인증을 해야 한다.
- 인증 수단은 본인 명의 휴대폰 인증과 I-PIN(일반, 공공)이다.

### NOL 티켓 (관찰, [NOL FAQ](https://board.yanolja.com/faq/list/index.html))

- 가입: NOL 계정은 "내외국인 및 나이 제한 없이 누구나" 가입하고, 카카오·네이버·구글·애플 계정이나 이메일로 가입한다([FAQ id=419](https://board.yanolja.com/faq/content/index.html?id=419)). 가입 인증 문자는 휴대폰 인증 또는 이메일 인증으로 받는다([FAQ id=122](https://board.yanolja.com/faq/content/index.html?id=122)).
- 본인인증: 2024-07-11부터 본인인증은 인증일로부터 1년간 유효하다. 상품 상세의 [인증 후 예매하기] 버튼으로 하거나 마이페이지에서 미리 해 둘 수 있다. 바꾼 이유는 부정예매 방지다([FAQ id=675](https://board.yanolja.com/faq/content/index.html?id=675)).
- "본인 인증은 본인 명의 휴대폰 번호로만 할 수 있으며, 어려운 경우 일부 서비스 이용이 제한될 수 있습니다."([FAQ id=429](https://board.yanolja.com/faq/content/index.html?id=429)) 가입 때 등록한 회원 정보와 일치하는 명의로만 인증된다([FAQ id=575](https://board.yanolja.com/faq/content/index.html?id=575)).
- 연령 제한 공연은 관람일 기준 성인이면 예매할 수 있고, 현장에서 실물 신분증 확인이 있을 수 있다([FAQ id=611](https://board.yanolja.com/faq/content/index.html?id=611)).

### 멜론티켓 (관찰, [FAQ](https://ticket.melon.com/customerservice/faq.htm))

- "제 명의의 휴대폰이 아니라도 휴대폰 인증이 가능한가요?"에 대한 답: 회원정보의 휴대폰 번호는 연락처 개념이라 "명의자 본인에 대한 정보입력 없이 인증번호 입력만으로 휴대폰번호 등록이 가능합니다."
- 19금 공연은 예매 시 성인인증을 하고, "성인인증은 본인명의 휴대폰인증을 통해 진행"된다.
- 일반 공연 예매에 본인인증이 필수인지는 FAQ에서 확인하지 못했다.

### 정리

- 세 곳 모두 가입 시점에 법적 본인인증을 강제하지 않는다(YES24는 간편 가입 후 예매 전 인증, NOL은 소셜/이메일 가입 후 예매 전 인증).
- 휴대폰 번호 등록(OTP, 연락처)과 본인인증(명의 확인)을 구분한다. 멜론 FAQ가 이 구분을 명시한다.
- 본인인증 상태는 계정에 "인증 여부 + 인증 일시"로 붙고, NOL은 유효기간 1년을 둔다. 한 사람(명의)당 인증된 계정 하나라는 제약도 있다(NOL FAQ 목록의 선예매 인증 이전, 다른 계정 인증 문항에서 관찰. 본문은 열어 보지 않음).

## 법적 맥락(요약)

- 정보통신서비스 제공자는 원칙적으로 주민등록번호를 수집·이용할 수 없고, 그 대체수단으로 방송통신위원회가 지정한 본인확인기관(이통 3사, NICE평가정보, 코리아크레딧뷰로, SCI평가정보 등)의 본인확인서비스를 쓴다. 근거는 정보통신망법 제23조의2(주민등록번호 사용 제한)와 제23조의3(본인확인기관 지정)이다. KISA 본인확인 지원포털 자료가 이 구조를 설명하나, 조사 시점에 포털이 보안 점검 중이었고 국가법령정보센터 조문 원문도 열리지 않아 **조문 원문은 직접 확인하지 못했다.**
- 본인확인기관이 아닌 웹사이트가 CI/DI와 실명을 받으려면 본인확인기관(또는 그 대행사)과 계약해야 하므로, Q1~Q3의 계약 요건이 여기서 나온다(추론).
- SMS OTP로 휴대폰 번호만 받는 것은 본인확인서비스가 아니라 일반 개인정보 수집이다. 수집 목적·항목·보유기간을 알리고 동의를 받는 일반 원칙이 적용된다(개인정보 보호법, 조문 원문은 이번에 확인하지 않음).
- 문자 발송 쪽은 발신번호 사전등록제와 2026-11-11 시행 문자 전송자격인증제가 적용된다(Q5).

## 오픈런 선택지(추론)

1. **(B) SMS OTP + 개발용 가짜 발송기, 데모에서 실제 사업자 — 추천.**
   - `SmsSender` 같은 경계를 두고 개발 환경 구현은 문자를 DB나 로그에 남겨 화면에서 보게 한다(Mailpit과 같은 역할). 테스트도 이 구현을 쓴다.
   - 데모 VPS에서는 솔라피 개인 계정에 사용자 본인 명의 휴대폰을 발신번호로 등록하고 VPS IP를 허용 IP로 넣는다. 건당 18원이고 개인 계정 하루 한도(50~500건)가 데모에는 충분하다. 실제 발송 없이 API 형태만 시험하려면 알리고의 `testmode_yn`도 있다.
   - 확인되는 것은 번호 소유뿐이다. 실제 서비스의 "휴대폰 번호 등록(연락처)"에 해당하고, 멜론의 연락처 번호 등록과 같은 모양이다.
2. **(A) 테스트 모드 본인인증 — 제한적으로만 가능.**
   - 토스인증 테스트 환경이 가상 인물 데이터를 주는 유일한 공식 경로다. 자격증명을 이메일로 받아야 하고, 개인에게 발급되는지 확인되지 않았다. 받더라도 데모 방문자에게 열 수 없는 테스트 전용이다.
   - 이니시스 `INIiasTest`는 공개 샘플 값이지만, 실제 인증서로 실제 개인정보를 받는 것으로 보여 공개 데모에 쓰기 부적절하다.
   - PortOne 테스트 채널은 다날이 테스트를 지원하지 않고, KCP·이니시스는 테스트 동작이 문서에 없다.
3. **(C) 본인인증 생략.** 가장 단순하다. 다만 실제 서비스가 예매 전 본인인증을 요구하므로, 모델은 실제와 같이 계정에 `본인인증 완료 일시`(와 유효기간 1년 같은 규칙)를 두고 값은 시드나 개발용 "가짜 본인인증" 버튼으로 채우는 절충을 권한다. 실제와 다른 점(법적 본인확인을 하지 않음)과 이유(개인은 본인확인기관 계약 불가)는 스펙이나 ADR에 적는다.

## 확인하지 못한 것

- PortOne 콘솔 테스트 모드에서 KCP·이니시스 통합인증 공용 테스트 채널이 실제로 뜨는지(계정 생성이 필요해 하지 않음).
- 이니시스 `INIiasTest`가 돌려주는 데이터가 실제인지 가상인지, 사용 허용 범위.
- 토스인증 테스트 자격증명을 비사업자 개인에게 발급하는지.
- NICE, KCB, 다날의 공식 신청 요건과 샌드박스 유무.
- 네이버 클라우드 SENS의 개인 회원 사용 가능 여부와 요금, 알리고의 개인 사용 가능 여부와 단가.
- 정보통신망법 제23조의2, 제23조의3 조문 원문.
- 멜론티켓 일반 공연 예매 시 본인인증 필수 여부.

## 출처

- PortOne: [결제대행사 채널 설정하기](https://developers.portone.io/opi/ko/integration/ready/readme?v=v2), [본인인증 연동하기 V2](https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2), [다날 본인인증](https://developers.portone.io/opi/ko/integration/pg/v2/danal-identity-verification), [이니시스 통합인증](https://developers.portone.io/opi/ko/integration/pg/v2/inicis-unified-identity-verification), [문서 저장소](https://github.com/portone-io/developers.portone.io), [헬프센터 본인인증](https://help.portone.io/content/identity-verification), [헬프센터 다날](https://help.portone.io/content/danal)
- KG이니시스: [통합인증서비스](https://sign-service.inicis.com/), [통합인증 개발가이드](https://manual.inicis.com/sa/auth.html), [공식 샘플](https://manual.inicis.com/download/SaSample.zip), [그누보드7 이니시스 플러그인](https://github.com/gnuboard/g7-plugin-sirsoft-verification_kginicis)
- NICE(2차 자료): [NICE아이디 제휴서비스 신청서 양식](https://www.codemshop.com/wp-content/uploads/2026/05/NICE아이디제휴서비스신청서코드엠_2026_v1.3_.docx)
- 토스: [토스인증](https://toss.im/tosscert), [테스트 가이드](https://toss.im/tosscert/docs/guides/test), [공통 가이드](https://toss.im/tosscert/docs/guides/common), [토스페이먼츠 셀러 본인인증 가이드](https://www.tosspayments.com/blog/articles/54697)
- 솔라피: [시작 가이드](https://solapi.com/guides/start), [요금](https://solapi.com/pricing), [발신번호 FAQ](https://solapi.com/guides/senderid-faq), [문자 전송자격인증제 공지](https://solapi.com/notices/20261109-230704)
- NHN Cloud: [SMS 콘솔 가이드](https://docs.nhncloud.com/ko/Notification/SMS/ko/console-guide/)
- 네이버 클라우드: [SENS 발신번호](https://guide.ncloud-docs.com/docs/sens-callingno)
- 알리고: [API 스펙](https://smartsms.aligo.in/admin/api/spec.html)
- Twilio: [Verify 요금](https://www.twilio.com/en-us/verify/pricing), [KR SMS 가이드라인](https://www.twilio.com/en-us/guidelines/kr/sms), [KR SMS 요금](https://www.twilio.com/en-us/sms/pricing/kr)
- YES24 티켓: [FAQ](https://ticket.yes24.com/UserGuide/FAQ)
- NOL: [FAQ 목록](https://board.yanolja.com/faq/list/index.html), [가입](https://board.yanolja.com/faq/content/index.html?id=419), [가입 인증 문자](https://board.yanolja.com/faq/content/index.html?id=122), [본인인증 재인증](https://board.yanolja.com/faq/content/index.html?id=675), [본인 명의 휴대폰](https://board.yanolja.com/faq/content/index.html?id=429), [본인인증 실패](https://board.yanolja.com/faq/content/index.html?id=575), [연령 제한 공연](https://board.yanolja.com/faq/content/index.html?id=611)
- 멜론티켓: [FAQ](https://ticket.melon.com/customerservice/faq.htm)
