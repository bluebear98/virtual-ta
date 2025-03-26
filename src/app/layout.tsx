import { ReactNode } from 'react';

export const metadata = {
  title: 'Virtual TA',
  description: 'Analyze lecture transcripts and slides',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
