import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DigitalHeroes - Lead Management',
  description: 'Lead management platform for Digital Heroes',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="text-center text-sm text-gray-500 py-4 border-t">
          Built for{' '}
          <a href="https://digitalheroesco.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Digital Heroes Training Task
          </a>
        </footer>
      </body>
    </html>
  );
}
