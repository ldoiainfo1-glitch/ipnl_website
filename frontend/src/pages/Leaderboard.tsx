import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';
import { getInitials } from '@/utils/formatters';

export default function Leaderboard() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const { leaderboard, myRank, isLoading } = useLeaderboard(period);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top performers in the IPN network
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {(['week', 'month', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-md transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
          </button>
        ))}
      </div>

      {/* My Rank */}
      {myRank && (
        <Card className="bg-primary/10 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Rank</p>
                <p className="text-3xl font-bold">#{myRank.rank}</p>
                <p className="text-sm text-muted-foreground">
                  Top {myRank.percentile}% of {myRank.totalUsers} members
                </p>
              </div>
              <Trophy className="w-12 h-12 text-primary" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No data available</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center p-4 rounded-lg border ${
                    entry.rank <= 3 ? 'bg-secondary/50 border-primary' : 'border-border'
                  }`}
                >
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  <Avatar className="mx-4">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(entry.user.companyName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-semibold">{entry.user.companyName}</p>
                    <p className="text-sm text-muted-foreground">{entry.user.role}</p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Intros</p>
                        <p className="font-semibold">{entry.totalIntros}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Success</p>
                        <p className="font-semibold">{entry.successfulIntros}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="font-semibold text-primary">{entry.reputationScore}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
