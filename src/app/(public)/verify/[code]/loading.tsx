import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

export default function VerifyResultLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Success header: icon + title + subtitle */}
        <div className="text-center mb-6">
          <S variant="circular" width="4rem" height="4rem" className="mx-auto mb-4" />
          <S variant="text" height="1.75rem" width="12rem" className="mx-auto mb-2" />
          <S variant="text" height="0.85rem" width="22rem" className="mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Certificate Preview card (2 cols on lg) */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Toolbar: label + download button */}
              <div className="p-4 border-b border-border-default bg-bg-elevated flex items-center justify-between">
                <S variant="text" height="0.85rem" width="9rem" />
                <S height="2.25rem" width="7rem" />
              </div>
              {/* Embedded preview placeholder */}
              <div className="bg-bg-elevated h-[60vh] min-h-[360px] sm:h-[600px] flex items-center justify-center">
                <S variant="rectangular" width="85%" height="90%" className="rounded-lg" />
              </div>
            </Card>
          </div>

          {/* Sidebar (1 col on lg) */}
          <div className="lg:col-span-1 space-y-4">

            {/* Verification status card */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <S variant="circular" width="1.5rem" height="1.5rem" className="shrink-0" />
                <div className="space-y-1.5">
                  <S height="1.4rem" width="5rem" className="rounded-full" />
                  <S variant="text" height="0.85rem" width="9rem" className="font-mono" />
                </div>
              </div>
            </Card>

            {/* Certificate details card */}
            <Card className="p-4 space-y-4">
              {/* Recipient */}
              <div className="flex items-start gap-3">
                <S variant="circular" width="1rem" height="1rem" className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <S variant="text" height="0.7rem" width="5rem" />
                  <S variant="text" height="1rem" width="10rem" />
                </div>
              </div>
              {/* Competition */}
              <div className="flex items-start gap-3">
                <S variant="circular" width="1rem" height="1rem" className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <S variant="text" height="0.7rem" width="6rem" />
                  <S variant="text" height="0.9rem" width="13rem" />
                </div>
              </div>
              {/* Issue date */}
              <div className="flex items-start gap-3">
                <S variant="circular" width="1rem" height="1rem" className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <S variant="text" height="0.7rem" width="5rem" />
                  <S variant="text" height="0.9rem" width="9rem" />
                </div>
              </div>
            </Card>

            {/* Mobile download button */}
            <S height="3rem" width="100%" className="lg:hidden" />

            {/* Back link */}
            <S variant="text" height="0.85rem" width="11rem" className="pt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
