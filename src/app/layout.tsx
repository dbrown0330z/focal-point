import { Lora } from 'next/font/google';

const lora = Lora({
  subsets:  ['latin'],
  weight:   ['400', '500', '700'],
  variable: '--font-lora',
});

import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={lora.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}