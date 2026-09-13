import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '先声 · 找到已经做过这件事的人',
  description: '描述你正纠结的处境，找到知乎上已经做过这件事的人，生成一段基于对方真实经历的破冰开场白。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
