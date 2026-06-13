import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { User, Mail, Calendar, Trophy, Target, Award } from 'lucide-react';
import { SCORING_METRIC_INFO } from '@/lib/constants';

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = (await supabase
    .from('users')
    .select('full_name, role, created_at')
    .eq('id', user.id)
    .single()) as { data: any };

  // Get user's competitions count
  const { count: competitionsCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved');

  // Get user's submissions count
  const { count: submissionsCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Get best scores with metric info
  const { data: bestScores } = (await supabase
    .from('submissions')
    .select(`
      score,
      competitions (
        title,
        scoring_metric
      )
    `)
    .eq('user_id', user.id)
    .eq('is_best_score', true)
    .limit(5)) as { data: any };

  // Sort in JavaScript based on metric type (can't do in SQL when mixing metrics)
  const sortedBestScores = bestScores?.sort((a: any, b: any) => {
    const metricA = a.competitions?.scoring_metric || 'f1_score';
    const metricB = b.competitions?.scoring_metric || 'f1_score';
    const infoA = SCORING_METRIC_INFO[metricA as keyof typeof SCORING_METRIC_INFO];
    const infoB = SCORING_METRIC_INFO[metricB as keyof typeof SCORING_METRIC_INFO];

    // Group by metric type, then sort within group
    if (infoA?.type !== infoB?.type) {
      return infoA?.type === 'classification' ? -1 : 1; // Classification first
    }

    // Within same type, sort by score direction
    if (infoA?.higher_is_better) {
      return (b.score || 0) - (a.score || 0); // DESC for higher_is_better
    } else {
      return (a.score || 0) - (b.score || 0); // ASC for lower_is_better
    }
  }) || [];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl gradient-text leading-tight mb-2">My Profile</h1>
          <p className="text-text-secondary">Manage your account and view your competition stats</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-gradient-brand rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-3xl">
                    {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-center mb-1">
                  {profile?.full_name || 'Anonymous User'}
                </h2>
                <Badge variant={profile?.role === 'admin' ? 'red' : 'blue'}>
                  {profile?.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>

              {/* User Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Joined {new Date(profile?.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Edit Profile Button */}
              <div className="mt-6">
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </div>
            </Card>
          </div>

          {/* Stats & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Card className="relative overflow-hidden p-4 sm:p-6">
                <Trophy className="absolute -bottom-3 -right-3 h-14 w-14 sm:h-16 sm:w-16 text-warning opacity-[0.12] rotate-[-8deg] pointer-events-none select-none" />
                <p className="relative text-2xl sm:text-3xl font-bold mb-1 font-mono">{competitionsCount || 0}</p>
                <p className="relative text-xs sm:text-sm text-text-tertiary">Competitions</p>
              </Card>

              <Card className="relative overflow-hidden p-4 sm:p-6">
                <Target className="absolute -bottom-3 -right-3 h-14 w-14 sm:h-16 sm:w-16 text-primary-blue opacity-[0.12] rotate-[-8deg] pointer-events-none select-none" />
                <p className="relative text-2xl sm:text-3xl font-bold mb-1 font-mono">{submissionsCount || 0}</p>
                <p className="relative text-xs sm:text-sm text-text-tertiary">Submissions</p>
              </Card>

              <Card className="relative overflow-hidden p-4 sm:p-6">
                <Award className="absolute -bottom-3 -right-3 h-14 w-14 sm:h-16 sm:w-16 text-success opacity-[0.12] rotate-[-8deg] pointer-events-none select-none" />
                <p className="relative text-2xl sm:text-3xl font-bold mb-1 font-mono">{bestScores?.length || 0}</p>
                <p className="relative text-xs sm:text-sm text-text-tertiary">Best Scores</p>
              </Card>
            </div>

            {/* Best Scores */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">
                Top Performances
              </h3>

              {sortedBestScores && sortedBestScores.length > 0 ? (
                <div className="space-y-3">
                  {sortedBestScores.map((submission: any, index: number) => {
                    const metric = submission.competitions?.scoring_metric || 'f1_score';
                    const metricInfo = SCORING_METRIC_INFO[metric as keyof typeof SCORING_METRIC_INFO];

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 p-4 bg-bg-elevated rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-bold text-lg text-text-tertiary shrink-0">#{index + 1}</span>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{submission.competitions?.title}</p>
                            <p className="text-sm text-text-tertiary">Competition</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-xl text-primary-blue">
                            {submission.score?.toFixed(metricInfo?.decimals || 4)}
                            {metricInfo?.higher_is_better === false && ' ↓'}
                            {metricInfo?.higher_is_better === true && ' ↑'}
                          </p>
                          <p className="text-xs text-text-tertiary">{metricInfo?.name || 'Score'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
                  <p className="text-text-tertiary">No submissions yet</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Start competing to see your best scores here
                  </p>
                </div>
              )}
            </Card>

            {/* Account Settings */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Account Settings</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile Information
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Change Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
