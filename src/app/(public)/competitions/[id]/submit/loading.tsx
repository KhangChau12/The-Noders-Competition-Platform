import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function SubmitLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 space-y-2">
          <Skeleton variant="text" height="0.9rem" width="12rem" className="mb-4" />
          <Skeleton variant="text" height="3rem" width="65%" />
          <Skeleton variant="text" height="1rem" width="40%" />
        </div>

        {/* Quota cards: daily + total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {[0, 1].map((i) => (
            <Card key={i} className="p-6 border-l-4 border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" height="0.85rem" width="9rem" />
                <Skeleton variant="circular" width="1.25rem" height="1.25rem" />
              </div>
              <Skeleton variant="text" height="2rem" width="8rem" />
              <Skeleton variant="text" height="0.75rem" width="12rem" />
            </Card>
          ))}
        </div>

        {/* Submit form card */}
        <Card className="p-6 sm:p-8 space-y-6">
          {/* Phase tabs (4-phase competitions) */}
          <div className="flex gap-6 border-b border-border-default pb-3">
            <Skeleton variant="text" height="1rem" width="6rem" />
            <Skeleton variant="text" height="1rem" width="7rem" />
          </div>

          {/* File upload area */}
          <div className="space-y-1.5">
            <Skeleton variant="text" height="0.85rem" width="5rem" />
            <div className="rounded-xl border-2 border-dashed border-border-default h-36 flex flex-col items-center justify-center gap-3">
              <Skeleton variant="circular" width="3rem" height="3rem" />
              <Skeleton variant="text" height="0.85rem" width="14rem" />
              <Skeleton variant="text" height="0.75rem" width="10rem" />
            </div>
          </div>

          {/* Submission rules */}
          <div className="rounded-lg bg-bg-elevated p-4 space-y-2">
            <Skeleton variant="text" height="0.85rem" width="80%" />
            <Skeleton variant="text" height="0.85rem" width="65%" />
            <Skeleton variant="text" height="0.85rem" width="72%" />
          </div>

          <Skeleton height="2.75rem" width="100%" />
        </Card>

        {/* Recent submissions */}
        <div className="mt-8">
          <Skeleton variant="text" height="1.4rem" width="12rem" className="mb-4" />
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg-surface border-b border-border-default">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <th key={i} className="px-4 py-3.5">
                        <Skeleton variant="text" height="0.85rem" width="70%" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((r) => (
                    <tr key={r} className="border-b border-border-default/50">
                      {[0, 1, 2, 3, 4].map((c) => (
                        <td key={c} className="px-4 py-3.5">
                          <Skeleton variant="text" height="0.85rem" width={c === 0 ? '80%' : '55%'} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
