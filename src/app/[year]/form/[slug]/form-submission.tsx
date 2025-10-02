'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, FileText } from 'lucide-react';
import { submitFormResponse } from '@/app/actions';
import type { Form, FormField } from '@/lib/data';

const initialSubmissionState = {
  success: false,
  message: '',
};

type FormSubmissionProps = {
  form: Form;
  year: number;
  eventSlug: string;
};

export default function FormSubmission({ form, year, eventSlug }: FormSubmissionProps) {
  const [state, formAction, isPending] = useActionState(submitFormResponse, initialSubmissionState);
  const [formData, setFormData] = useState<{ [fieldId: string]: string | string[] }>({});
  const [submitterName, setSubmitterName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Reset form after successful submission
  useEffect(() => {
    if (state.success && !hasSubmitted) {
      setHasSubmitted(true);
      setFormData({});
      setSubmitterName('');
    }
  }, [state.success, hasSubmitted]);

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, optionValue: string, checked: boolean) => {
    const currentValues = (formData[fieldId] as string[]) || [];
    if (checked) {
      handleFieldChange(fieldId, [...currentValues, optionValue]);
    } else {
      handleFieldChange(fieldId, currentValues.filter(v => v !== optionValue));
    }
  };

  const handleSubmit = (formDataObj: FormData) => {
    // Add all form field values to FormData
    Object.entries(formData).forEach(([fieldId, value]) => {
      if (Array.isArray(value)) {
        // For checkbox arrays, add each value separately
        value.forEach(v => formDataObj.append(`field_${fieldId}`, v));
      } else if (value) {
        formDataObj.set(`field_${fieldId}`, value);
      }
    });
    
    // Add submitter name
    if (submitterName) {
      formDataObj.set('submitterName', submitterName);
    }
    
    formAction(formDataObj);
  };

  const renderField = (field: FormField) => {
    const fieldValue = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            value={fieldValue as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={fieldValue as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={fieldValue as string}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={fieldValue as string}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            required={field.required}
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}_${index}`} />
                <Label htmlFor={`${field.id}_${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}_${index}`}
                  checked={(fieldValue as string[])?.includes(option) || false}
                  onCheckedChange={(checked) => handleCheckboxChange(field.id, option, !!checked)}
                />
                <Label htmlFor={`${field.id}_${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (!form.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Closed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This form is no longer accepting submissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show success message after submission
  if (hasSubmitted && state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Form Submitted Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Thank you for your submission! Your response has been recorded.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setHasSubmitted(false);
                setFormData({});
                setSubmitterName('');
              }}
              variant="outline"
            >
              Submit Another Response
            </Button>
            <Button asChild>
              <a href={`/${year}/form/${eventSlug}?results=true`}>
                View All Responses
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
          <FileText className="h-5 w-5" />
          Submit Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="eventSlug" value={eventSlug} />

          {state.message && (
            <Alert variant={state.success ? 'default' : 'destructive'}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {!form.allowAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="submitterName">Your Name *</Label>
              <Input
                id="submitterName"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          {form.allowAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="submitterName">Your Name (Optional)</Label>
              <Input
                id="submitterName"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Enter your name or leave blank for anonymous"
              />
            </div>
          )}

          {form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {isPending ? 'Submitting...' : 'Submit Form'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            {!form.allowAnonymous && 'Your name will be recorded with your submission.'}
            {form.allowAnonymous && 'You can submit this form anonymously or with your name.'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
