import type { Metadata } from 'next';
import { JetBrains_Mono, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';
import './globals.css';

const notoSerifSC = Noto_Serif_SC({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '先声 · 找到已经做过这件事的人',
  description: '描述你正纠结的处境,找到知乎上已经做过这件事的人,生成一段基于对方真实经历的破冰开场白。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSerifSC.variable} ${notoSansSC.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
