'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Trophy } from 'lucide-react';
import type { Poll } from '@/lib/data';

type PollResultsProps = {
  poll: Poll;
  year: number;
  eventSlug: string;
};

export default function PollResults({ poll }: PollResultsProps) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const maxVotes = Math.max(...poll.options.map(option => option.votes));
  
  // Sort options by votes (descending)
  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Poll Results
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{totalVotes} total votes</span>
          </div>
          <Badge variant="secondary">
            {poll.isActive ? 'Active' : 'Closed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {totalVotes === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No votes yet. Be the first to vote!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedOptions.map((option, index) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              const isWinner = option.votes === maxVotes && maxVotes > 0;
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.text}</span>
                      {isWinner && index === 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{option.votes} votes</span>
                      <span>({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-3" />
                  
                  {/* Show voters if not anonymous and there are voters */}
                  {!poll.allowAnonymous && option.voters.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Voters: </span>
                      {option.voters
                        .filter(voter => !voter.startsWith('anonymous_'))
                        .join(', ') || 'Anonymous voters only'}
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Poll Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Votes:</span>
                  <span className="ml-2 font-medium">{totalVotes}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Options:</span>
                  <span className="ml-2 font-medium">{poll.options.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 font-medium">
                    {poll.multipleChoice ? 'Multiple Choice' : 'Single Choice'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Anonymous:</span>
                  <span className="ml-2 font-medium">
                    {poll.allowAnonymous ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
