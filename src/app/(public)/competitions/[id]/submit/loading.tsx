import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

export default function SubmitLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header: back link + h1 + subtitle */}
        <div className="mb-8">
          <S variant="text" height="0.9rem" width="12rem" className="mb-4" />
          <S variant="text" height="3rem" width="65%" className="mb-2" />
          <S variant="text" height="1rem" width="40%" />
        </div>

        {/* Quota cards: daily (border-primary-blue) + total (border-accent-cyan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {[0, 1].map((i) => (
            <Card key={i} className="p-6 border-l-4 border-border-default space-y-2">
              <div className="flex items-center justify-between">
                <S variant="text" height="0.85rem" width="9rem" />
                <S variant="circular" width="1.25rem" height="1.25rem" />
              </div>
              <S variant="text" height="2rem" width="8rem" />
              <S variant="text" height="0.75rem" width="12rem" />
            </Card>
          ))}
        </div>

        {/* Submit form card */}
        <Card className="p-6 sm:p-8 space-y-6">
          {/* Phase tabs */}
          <div className="flex gap-6 border-b border-border-default pb-3">
            <S variant="text" height="1rem" width="6rem" />
            <S variant="text" height="1rem" width="7rem" />
          </div>

          {/* File upload area */}
          <div className="space-y-1.5">
            <S variant="text" height="0.85rem" width="5rem" />
            <div className="rounded-xl border-2 border-dashed border-border-default h-36 flex flex-col items-center justify-center gap-3">
              <S variant="circular" width="3rem" height="3rem" />
              <S variant="text" height="0.85rem" width="14rem" />
              <S variant="text" height="0.75rem" width="10rem" />
            </div>
          </div>

          {/* Submission rules */}
          <div className="rounded-lg bg-bg-elevated p-4 space-y-2">
            <S variant="text" height="0.85rem" width="80%" />
            <S variant="text" height="0.85rem" width="65%" />
            <S variant="text" height="0.85rem" width="72%" />
          </div>

          <S height="2.75rem" width="100%" />
        </Card>

        {/* My Submissions card */}
        <Card className="p-5 sm:p-8 mt-8">
          <S variant="text" height="1.75rem" width="10rem" className="mb-6" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border-default">
                <tr>
                  {['Rank', 'Score', 'Phase', 'Status', 'Submitted At'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left">
                      <S variant="text" height="0.85rem" width="70%" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {[0, 1, 2, 3, 4].map((r) => (
                  <tr key={r}>
                    <td className="px-4 py-3"><S variant="text" height="0.85rem" width="2rem" /></td>
                    <td className="px-4 py-3"><S variant="text" height="0.85rem" width="5rem" /></td>
                    <td className="px-4 py-3"><S height="1.4rem" width="4.5rem" className="rounded-full" /></td>
                    <td className="px-4 py-3"><S height="1.4rem" width="5rem" className="rounded-full" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><S variant="text" height="0.85rem" width="7rem" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
