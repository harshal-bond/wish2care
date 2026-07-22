import { forwardRef } from 'react';
import { CLASSIFICATION } from '@wish2care/shared';
import { cn } from '../../lib/utils';

interface ClassificationSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const ClassificationSelect = forwardRef<HTMLSelectElement, ClassificationSelectProps>(
  ({ className, value, ...props }, ref) => {
    return (
      <select
        ref={ref}
        value={value || ''}
        className={cn(
          "flex h-12 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-medium",
          {
            'border-gray-300 text-gray-900': !value,
            'border-green-500 bg-green-50 text-green-700': value === CLASSIFICATION.NORMAL,
            'border-orange-500 bg-orange-50 text-orange-700': value === CLASSIFICATION.CAUTION,
            'border-red-500 bg-red-50 text-red-700': value === CLASSIFICATION.HIGH_RISK,
          },
          className
        )}
        {...props}
      >
        <option value="" disabled>Select Classification</option>
        <option value={CLASSIFICATION.NORMAL}>Normal</option>
        <option value={CLASSIFICATION.CAUTION}>Caution</option>
        <option value={CLASSIFICATION.HIGH_RISK}>High-risk</option>
      </select>
    );
  }
);
ClassificationSelect.displayName = 'ClassificationSelect';
