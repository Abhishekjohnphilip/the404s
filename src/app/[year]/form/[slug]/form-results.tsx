'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Users, Calendar } from 'lucide-react';
import type { Form } from '@/lib/data';

type FormResultsProps = {
  form: Form;
  year: number;
  eventSlug: string;
};

export default function FormResults({ form }: FormResultsProps) {
  const totalSubmissions = form.submissions.length;

  const formatResponse = (response: string | string[]) => {
    if (Array.isArray(response)) {
      return response.join(', ');
    }
    return response;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Form Submissions
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{totalSubmissions} submissions</span>
          </div>
          <Badge variant="secondary">
            {form.isActive ? 'Active' : 'Closed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {totalSubmissions === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-4">Form Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Submissions:</span>
                  <div className="font-medium">{totalSubmissions}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Form Fields:</span>
                  <div className="font-medium">{form.fields.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Anonymous Allowed:</span>
                  <div className="font-medium">{form.allowAnonymous ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="font-medium">{form.isActive ? 'Active' : 'Closed'}</div>
                </div>
              </div>
            </div>

            {/* Field Analysis */}
            <div>
              <h3 className="font-medium mb-4">Field Analysis</h3>
              <div className="space-y-4">
                {form.fields.map((field) => {
                  const responses = form.submissions
                    .map(sub => sub.responses[field.id])
                    .filter(Boolean);
                  
                  const responseCount = responses.length;
                  const responseRate = totalSubmissions > 0 ? (responseCount / totalSubmissions * 100).toFixed(1) : '0';

                  return (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{field.label}</h4>
                        <div className="text-sm text-muted-foreground">
                          {responseCount}/{totalSubmissions} responses ({responseRate}%)
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Type: {field.type} {field.required && '(Required)'}
                      </div>
                      
                      {/* Show unique responses for certain field types */}
                      {(field.type === 'select' || field.type === 'radio') && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Response Distribution:</div>
                          {field.options?.map(option => {
                            const count = responses.filter(r => 
                              Array.isArray(r) ? r.includes(option) : r === option
                            ).length;
                            const percentage = responseCount > 0 ? (count / responseCount * 100).toFixed(1) : '0';
                            return (
                              <div key={option} className="text-sm text-muted-foreground">
                                {option}: {count} ({percentage}%)
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Submissions */}
            <div>
              <h3 className="font-medium mb-4">Individual Submissions</h3>
              <div className="space-y-6">
                {form.submissions.map((submission, index) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">
                        Submission #{index + 1}
                        {submission.submitterName && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            by {submission.submitterName}
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(submission.submittedAt)}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {form.fields.map((field) => {
                        const response = submission.responses[field.id];
                        return (
                          <div key={field.id}>
                            <div className="text-sm font-medium text-muted-foreground">
                              {field.label}:
                            </div>
                            <div className="text-sm">
                              {response ? formatResponse(response) : <em>No response</em>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
