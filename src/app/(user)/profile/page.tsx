import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { User, Mail, Calendar, Trophy, Target, Award } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's competitions count
  const { count: competitionsCount } = await supabase
    .from('registrations')
    .select('*', { count: 'only', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved');

  // Get user's submissions count
  const { count: submissionsCount } = await supabase
    .from('submissions')
    .select('*', { count: 'only', head: true })
    .eq('user_id', user.id);

  // Get best scores
  const { data: bestScores } = await supabase
    .from('submissions')
    .select(`
      score,
      competitions (
        title
      )
    `)
    .eq('user_id', user.id)
    .eq('is_best_score', true)
    .order('score', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
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
                    {profile?.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-center mb-1">
                  {profile?.full_name || 'Anonymous User'}
                </h2>
                <Badge variant={profile?.role === 'admin' ? 'error' : 'primary'}>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-warning" />
                <p className="text-3xl font-bold mb-1">{competitionsCount || 0}</p>
                <p className="text-sm text-text-tertiary">Competitions</p>
              </Card>

              <Card className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary-blue" />
                <p className="text-3xl font-bold mb-1">{submissionsCount || 0}</p>
                <p className="text-sm text-text-tertiary">Submissions</p>
              </Card>

              <Card className="p-6 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-3xl font-bold mb-1">{bestScores?.length || 0}</p>
                <p className="text-sm text-text-tertiary">Best Scores</p>
              </Card>
            </div>

            {/* Best Scores */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Top Performances
              </h3>

              {bestScores && bestScores.length > 0 ? (
                <div className="space-y-3">
                  {bestScores.map((submission: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-text-tertiary">#{index + 1}</span>
                        <div>
                          <p className="font-semibold truncate">{submission.competitions?.title}</p>
                          <p className="text-sm text-text-tertiary">Competition</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-xl text-primary-blue">
                          {submission.score?.toFixed(4)}
                        </p>
                        <p className="text-xs text-text-tertiary">F1 Score</p>
                      </div>
                    </div>
                  ))}
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
