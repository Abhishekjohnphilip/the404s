'use client';

import { useState, useEffect, useRef } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Trash2, BarChart3 } from 'lucide-react';
import { addPoll } from '@/app/actions';
import type { EventFormState } from '@/app/actions';

const initialPollState: EventFormState = {
  success: false,
  message: '',
};

type PollDialogProps = {
  year: number;
  onSuccess: () => void;
};

export default function PollDialog({ year, onSuccess }: PollDialogProps) {
  const [state, formAction, isPending] = useActionState(addPoll, initialPollState);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(['', '']);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      onSuccess();
      formRef.current?.reset();
      setOptions(['', '']);
    }
  }, [state, isPending, onSuccess]);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart3 className="mr-2 h-4 w-4" />
          Add Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form action={formAction} ref={formRef}>
          <input type="hidden" name="year" value={year} />
          {options.map((option, index) => (
            <input key={index} type="hidden" name="options[]" value={option} />
          ))}
          
          <DialogHeader>
            <DialogTitle>Add New Poll to {year}</DialogTitle>
            <DialogDescription>
              Create a poll that users can vote on.
            </DialogDescription>
          </DialogHeader>

          {state.message && (
            <Alert variant={state.success ? 'default' : 'destructive'}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Poll Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Favorite Color"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                name="date"
                placeholder="e.g., December 25"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="question" className="text-right mt-2">
                Question
              </Label>
              <Textarea
                id="question"
                name="question"
                placeholder="What is your favorite color?"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Options</Label>
              <div className="col-span-3 space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Settings</Label>
              <div className="col-span-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="allowAnonymous" name="allowAnonymous" value="true" />
                  <Label htmlFor="allowAnonymous">Allow anonymous voting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="multipleChoice" name="multipleChoice" value="true" />
                  <Label htmlFor="multipleChoice">Allow multiple choices</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Poll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
