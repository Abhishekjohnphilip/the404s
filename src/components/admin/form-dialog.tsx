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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Trash2, FileText, Settings } from 'lucide-react';
import { addForm } from '@/app/actions';
import type { EventFormState } from '@/app/actions';
import type { FormField } from '@/lib/data';

const initialFormState: EventFormState = {
  success: false,
  message: '',
};

type FormDialogProps = {
  year: number;
  onSuccess: () => void;
};

const fieldTypes = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
];

export default function FormDialog({ year, onSuccess }: FormDialogProps) {
  const [state, formAction, isPending] = useActionState(addForm, initialFormState);
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState<Partial<FormField>[]>([
    { label: '', type: 'text', required: false }
  ]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      onSuccess();
      formRef.current?.reset();
      setFields([{ label: '', type: 'text', required: false }]);
    }
  }, [state, isPending, onSuccess]);

  const addField = () => {
    setFields([...fields, { label: '', type: 'text', required: false }]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const addOption = (fieldIndex: number) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (!field.options) {
      field.options = [''];
    } else {
      field.options = [...field.options, ''];
    }
    setFields(newFields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (field.options && field.options.length > 1) {
      field.options = field.options.filter((_, i) => i !== optionIndex);
      setFields(newFields);
    }
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (field.options) {
      field.options[optionIndex] = value;
      setFields(newFields);
    }
  };

  const handleSubmit = (formData: FormData) => {
    // Add fields data to form data
    formData.set('fields', JSON.stringify(fields));
    formAction(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Add Form
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form action={handleSubmit} ref={formRef}>
          <input type="hidden" name="year" value={year} />
          
          <DialogHeader>
            <DialogTitle>Add New Form to {year}</DialogTitle>
            <DialogDescription>
              Create a form that users can fill out and submit.
            </DialogDescription>
          </DialogHeader>

          {state.message && (
            <Alert variant={state.success ? 'default' : 'destructive'}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 py-4">
            {/* Basic Form Info */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Form Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Event Registration"
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
              <Label htmlFor="description" className="text-right mt-2">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what this form is for..."
                className="col-span-3"
                required
              />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Form Fields</Label>
              <div className="col-span-3 space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Field {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Field Label</Label>
                        <Input
                          value={field.label || ''}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Enter field label"
                          required
                        />
                      </div>
                      <div>
                        <Label>Field Type</Label>
                        <Select
                          value={field.type || 'text'}
                          onValueChange={(value) => {
                            const newType = value as FormField['type'];
                            const updates: Partial<FormField> = { type: newType };
                            
                            // Initialize options for field types that need them
                            if ((newType === 'select' || newType === 'radio' || newType === 'checkbox') && !field.options) {
                              updates.options = ['', ''];
                            }
                            // Clear options for field types that don't need them
                            else if (newType !== 'select' && newType !== 'radio' && newType !== 'checkbox') {
                              updates.options = undefined;
                            }
                            
                            updateField(index, updates);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Placeholder (optional)</Label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Enter placeholder text"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-6">
                        <Checkbox
                          id={`required-${index}`}
                          checked={field.required || false}
                          onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                        />
                        <Label htmlFor={`required-${index}`}>Required field</Label>
                      </div>
                    </div>

                    {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                      <div>
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {(field.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                              />
                              {(field.options?.length || 0) > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeOption(index, optionIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addOption(index)}
                            className="w-full"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addField}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </div>

            {/* Form Settings */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Settings</Label>
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="allowAnonymous" name="allowAnonymous" value="true" />
                  <Label htmlFor="allowAnonymous">Allow anonymous submissions</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Form'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
