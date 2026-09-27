import type { FormIssue } from '@/lib/types';

/** Id for a field that can have an issue: "stops.1.windowEnd" becomes "field-stops-1-windowEnd". */
export const fieldId = (field: string) => 'field-' + field.replaceAll('.', '-');

/** The first issue message for a field, if there is one. */
export function issueFor(issues: FormIssue[], field: string): string | undefined {
  return issues.find((issue) => issue.field === field)?.message;
}
