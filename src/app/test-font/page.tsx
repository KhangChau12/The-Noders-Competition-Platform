import { Shrikhand } from 'next/font/google';

const shrikhand = Shrikhand({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function TestFontPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold mb-8">Font Test Page</h1>

        {/* Test 1: Direct Shrikhand class from next/font */}
        <div className="bg-bg-surface p-6 rounded-xl">
          <div className="text-sm text-text-tertiary mb-3">
            1. Direct Shrikhand from next/font (với className)
          </div>
          <h2 className={`${shrikhand.className} text-5xl text-primary-blue`}>
            The Noders PTNK Competition
          </h2>
        </div>

        {/* Test 2: Using font-brand from Tailwind */}
        <div className="bg-bg-surface p-6 rounded-xl">
          <div className="text-sm text-text-tertiary mb-3">
            2. Using font-brand class (Tailwind config)
          </div>
          <h2 className="font-brand text-5xl text-accent-cyan">
            The Noders PTNK Competition
          </h2>
        </div>

        {/* Test 3: Default sans font */}
        <div className="bg-bg-surface p-6 rounded-xl">
          <div className="text-sm text-text-tertiary mb-3">
            3. Default font-sans (Nunito)
          </div>
          <h2 className="font-sans text-5xl text-text-primary">
            The Noders PTNK Competition
          </h2>
        </div>

        {/* Test 4: System font for comparison */}
        <div className="bg-bg-surface p-6 rounded-xl">
          <div className="text-sm text-text-tertiary mb-3">
            4. System font (để so sánh)
          </div>
          <h2 className="text-5xl text-text-primary" style={{ fontFamily: 'system-ui' }}>
            The Noders PTNK Competition
          </h2>
        </div>

        <div className="bg-warning/20 border border-warning p-6 rounded-xl">
          <h3 className="font-bold text-warning mb-3">Hướng dẫn kiểm tra:</h3>
          <ul className="space-y-2 text-sm">
            <li>✅ Mục 1 và 2 phải GIỐNG NHAU và có font Shrikhand (chữ retro, đặc biệt)</li>
            <li>✅ Mục 3 phải khác (Nunito - chữ tròn, dễ đọc)</li>
            <li>✅ Mục 4 là system font (khác hẳn)</li>
            <li className="mt-4 text-warning font-semibold">
              ⚠️ Nếu tất cả đều giống nhau → Font Shrikhand KHÔNG load được
            </li>
          </ul>
        </div>

        <div className="bg-info/20 border border-info p-6 rounded-xl">
          <h3 className="font-bold text-info mb-3">Debug Info:</h3>
          <div className="font-mono text-xs space-y-1 text-text-secondary">
            <div>Shrikhand className: {shrikhand.className}</div>
            <div>Tailwind font-brand: var(--font-shrikhand), cursive</div>
          </div>
        </div>
      </div>
    </div>
  );
}
