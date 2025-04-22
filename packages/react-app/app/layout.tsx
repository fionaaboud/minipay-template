import '@/styles/globals.css';

import { AppProvider } from '@/providers/AppProvider';

export const metadata = {
  title: 'MiniPay Apps',
  description: 'MiniPay integrated applications',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
