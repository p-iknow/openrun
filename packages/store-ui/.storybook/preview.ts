import type { Preview } from '@storybook/react-vite';
import './storybook.css';

const preview: Preview = {
  parameters: {
    // 접근성 위반을 경고가 아닌 실패로 표시한다.
    a11y: { test: 'error' },
  },
};

export default preview;
