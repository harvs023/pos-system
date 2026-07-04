import './globals.css';
import ToasterProvider from '../components/ToasterProvider';

export const metadata = {
  title: 'POS | Point of Sale',
  description: 'Point of Sale system for Philippine retail — cash, GCash, and card.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
