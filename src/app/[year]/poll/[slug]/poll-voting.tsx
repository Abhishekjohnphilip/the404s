'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Vote, Users } from 'lucide-react';
import { votePoll } from '@/app/actions';
import type { Poll } from '@/lib/data';

const initialVoteState = {
  success: false,
  message: '',
};

type PollVotingProps = {
  poll: Poll;
  year: number;
  eventSlug: string;
};

export default function PollVoting({ poll, year, eventSlug }: PollVotingProps) {
  const [state, formAction, isPending] = useActionState(votePoll, initialVoteState);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voterName, setVoterName] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  // Handle successful vote submission
  useEffect(() => {
    if (state.success && !hasVoted) {
      setHasVoted(true);
      setSelectedOptions([]);
      setVoterName('');
    }
  }, [state.success, hasVoted]);

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (poll.multipleChoice) {
      if (checked) {
        setSelectedOptions([...selectedOptions, optionId]);
      } else {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      }
    } else {
      setSelectedOptions(checked ? [optionId] : []);
    }
  };

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  if (!poll.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Poll Closed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This poll is no longer accepting votes.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show success message after voting
  if (hasVoted && state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Vote className="h-5 w-5" />
            Vote Submitted Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Thank you for voting! Your vote has been recorded.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setHasVoted(false);
                setSelectedOptions([]);
                setVoterName('');
              }}
              variant="outline"
            >
              Vote Again
            </Button>
            <Button asChild>
              <a href={`/${year}/poll/${eventSlug}?results=true`}>
                View Results
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5" />
          Cast Your Vote
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{totalVotes} votes so far</span>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="eventSlug" value={eventSlug} />
          {selectedOptions.map(optionId => (
            <input key={optionId} type="hidden" name="optionIds[]" value={optionId} />
          ))}

          {state.message && (
            <Alert variant={state.success ? 'default' : 'destructive'}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {!poll.allowAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="voterName">Your Name</Label>
              <Input
                id="voterName"
                name="voterName"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          {poll.allowAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="voterName">Your Name (Optional)</Label>
              <Input
                id="voterName"
                name="voterName"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Enter your name or leave blank for anonymous"
              />
            </div>
          )}

          <div className="space-y-4">
            <Label className="text-base font-medium">
              {poll.multipleChoice ? 'Select all that apply:' : 'Select one option:'}
            </Label>
            
            {poll.multipleChoice ? (
              <div className="space-y-3">
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={(checked) => handleOptionChange(option.id, !!checked)}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions[0] || ''}
                onValueChange={(value) => setSelectedOptions([value])}
              >
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isPending || selectedOptions.length === 0}
            className="w-full"
          >
            {isPending ? 'Submitting Vote...' : 'Submit Vote'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            {poll.multipleChoice 
              ? 'You can select multiple options.' 
              : 'You can only select one option.'
            }
            {!poll.allowAnonymous && ' Your name will be recorded with your vote.'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
