import {
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from './drawer-parts.js';

// 부품들을 `Drawer.Root`처럼 쓰도록 묶는다. 이 파일에는 'use client'를 붙이지 않는다.
// 'use client' 파일 안에서 객체를 만들어 내보내면, Server Component는 그 객체를 열어 볼 수 없어 `Drawer.Root`가 undefined가 된다.
// 여기서는 부품 하나하나가 클라이언트 참조이고, 객체는 서버에서 만들어지므로 Server Component에서도 `Drawer.Root`를 쓸 수 있다.
//
// <Drawer.Root>
//   <Drawer.Trigger>열기</Drawer.Trigger>
//   <Drawer.Popup>
//     <Drawer.Header>
//       <Drawer.Title />
//       <Drawer.Description />
//     </Drawer.Header>
//     <Drawer.Body />
//     <Drawer.Footer>
//       <Drawer.Close />
//     </Drawer.Footer>
//   </Drawer.Popup>
// </Drawer.Root>
export const Drawer = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Popup: DrawerPopup,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Close: DrawerClose,
};

export type {
  DrawerBodyProps,
  DrawerCloseProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerPopupProps,
  DrawerRootProps,
  DrawerTitleProps,
  DrawerTriggerProps,
} from './drawer-parts.js';
