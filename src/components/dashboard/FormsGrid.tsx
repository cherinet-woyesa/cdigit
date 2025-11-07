import React from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Assuming Form type is defined elsewhere and imported
import type { Form } from '@features/customer/Dashboard'; 

const FormCard = React.memo(React.forwardRef<HTMLDivElement, {
  form: Form;
  onClick: () => void;
  isFocused: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}>(({ form, onClick, isFocused, onKeyDown }, ref) => {
  const { t } = useTranslation();
  const label = t(`forms.${form.name}`, form.name);
  
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${label} - ${form.description}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={clsx(
        'group relative bg-white p-3 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ease-out',
        'hover:shadow-md hover:border-fuchsia-300 hover:transform hover:-translate-y-1',
        'focus:outline-none focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-700',
        isFocused && 'ring-4 ring-fuchsia-100 border-fuchsia-700 -translate-y-1',
        'active:scale-95'
      )}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-fuchsia-700 group-hover:bg-fuchsia-800 transition-all">
            <form.icon className="h-5 w-5 text-white" />
          </div>
          <span className={clsx(
            'px-2 py-1 rounded-full text-[10px] font-medium capitalize',
            'bg-fuchsia-100 text-fuchsia-800'
          )}>
            {form.category}
          </span>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
            {label}
          </h3>
          <p className="text-[12px] text-gray-500 line-clamp-2 leading-snug">
            {form.description}
          </p>
        </div>
        
        <div className="flex-shrink-0 flex items-center justify-end mt-2">
          <div className="flex items-center gap-1 text-fuchsia-700 group-hover:text-fuchsia-800 transition-colors">
            <span className="text-xs font-semibold">
              {form.name === 'history' ? t('viewHistory', 'View') : t('startForm', 'Start')}
            </span>
            <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}));

FormCard.displayName = 'FormCard';

const FormCardSkeleton: React.FC = () => (
  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 animate-pulse">
    <div className="flex items-center gap-3 mb-2">
      <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded mb-1 w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded mb-3 w-full"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    <div className="flex justify-end mt-2">
      <div className="h-4 w-12 bg-gray-200 rounded"></div>
    </div>
  </div>
);

interface FormsGridProps {
  forms: Form[];
  loading: boolean;
  focusedIndex: number;
  handleCardKeyDown: (idx: number) => (e: React.KeyboardEvent<HTMLDivElement>) => void;
  openForm: (form: Form) => void;
  cardRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  debouncedQuery: string;
}

const FormsGrid: React.FC<FormsGridProps> = ({ 
  forms, 
  loading, 
  focusedIndex, 
  handleCardKeyDown, 
  openForm, 
  cardRefs, 
  debouncedQuery 
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[...Array(10)].map((_, i) => (
          <FormCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-fuchsia-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <MagnifyingGlassIcon className="h-8 w-8 text-fuchsia-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('noResults', 'No services found')}
        </h3>
        <p className="text-gray-600">
          {debouncedQuery 
            ? t('noResultsForQuery', 'Try adjusting your search or filters')
            : t('noServicesAvailable', 'No services available in this category')
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {forms.map((form, idx) => (
        <FormCard
          key={form.name}
          form={form}
          onClick={() => openForm(form)}
          isFocused={focusedIndex === idx}
          onKeyDown={handleCardKeyDown(idx)}
          ref={(el: HTMLDivElement | null) => { cardRefs.current[idx] = el; }}
        />
      ))}
    </div>
  );
};

export default FormsGrid;
