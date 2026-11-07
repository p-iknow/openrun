// `language-*` 클래스가 있는 코드 블록만 강조한다. 클래스가 없는 블록은 그대로 둔다.
// file://로 열어도 동작하도록 ES 모듈이 아닌 일반 스크립트로 둔다.
document.querySelectorAll('pre code[class*="language-"]').forEach((codeElement) => {
  hljs.highlightElement(codeElement);
});
