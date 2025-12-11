import React, { useState } from 'react';
import { ChevronDown, Check, Plus, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export type FormFieldType = 'text' | 'select' | 'tags';
export interface FormField {
  key: string;
  label?: string;
  type: FormFieldType;
  description?: string;
  options?: string[]; // Suggestions or strict options provided by AI
  creatable?: boolean; // Whether the user can create new values not in options (default true)
  required?: boolean; // Validation (optional)
}

// --- Shared Components ---

const FieldWrapper: React.FC<{
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ label, description, required, className, children }) => (
  <div className={twMerge("mb-0", className)}>
    <div className="flex flex-wrap items-baseline gap-1 mb-1">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      {description && (
        <span className="text-xs text-slate-400 dark:text-slate-500 font-normal leading-tight">
          {description}
        </span>
      )}
    </div>
    {children}
  </div>
)

const SuggestionChip: React.FC<{
  label: string;
  onClick: () => void;
  isActive?: boolean;
}> = ({ label, onClick, isActive }) => (
  <button
    type="button"
    onClick={onClick}
    className={twMerge(
      "inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-medium transition-colors border",
      isActive
        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800"
        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
    )}
  >
    {isActive && <Check className="w-3 h-3 mr-1 text-indigo-600 dark:text-indigo-400" />}
    {label}
  </button>
)

const SuggestionsContainer: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={twMerge("flex flex-wrap gap-1 mt-2", className)}>
    {children}
  </div>
);

// --- Field Implementations ---

interface FieldProps {
  field: FormField;
  value: any;
  onChange: (val: any) => void;
}

// 1. Text Field
export const TextField: React.FC<FieldProps> = ({ field, value, onChange }) => {
  const safeValue = (value as string) || '';

  return (
    <FieldWrapper className='mb-1' label={field.label || field.key} description={field.description} required={field.required}>
      <input
        type="text"
        className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-xs focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm py-2 min-h-8 px-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
        // placeholder={field.placeholder || "Enter text..."}
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.options && field.options.length > 0 && (
        <SuggestionsContainer className='mt-1'>
          {/* <span className="text-xs text-slate-400 self-center mr-1">Quick pick:</span> */}
          {field.options.map((opt) => (
            <SuggestionChip
              key={opt}
              label={opt}
              isActive={safeValue === opt}
              onClick={() => onChange(opt)}
            />
          ))}
        </SuggestionsContainer>
      )}
    </FieldWrapper>
  );
}

// 2. Select Field
export const SelectField: React.FC<FieldProps> = ({ field, value, onChange }) => {
  const safeValue = (value as string) || '';
  // Default to true for better UX in compact mode, unless explicitly forbidden
  const isCreatable = field.creatable !== false; 
  const options = field.options || [];
  // Increased threshold to trigger button view more often
  const useCompactMode = options.length > 0 && options.length <= 10;

  if (useCompactMode) {
    // Render as buttons + custom input at the end
    return (
      <FieldWrapper label={field.label} description={field.description} required={field.required}>
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 -mt-1 -mx-1 transition-colors">
          {options.map((opt) => {
            const isSelected = safeValue === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={twMerge(
                  "px-2 py-0.5 min-h-8 rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700 transition-all shadow-xs",
                  isSelected
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
              >
                {opt}
              </button>
            );
          })}
          
          {/* Always render input in compact mode to allow custom entry */}
           <div className="relative flex-1 min-w-[100px] max-w-xs">
             <input
               type="text"
               placeholder="Custom..."
               className="text-xs min-h-8 block w-full rounded-md border-slate-200 dark:border-slate-600 shadow-xs focus:border-indigo-500 dark:focus:border-indigo-400 py-0.5 px-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
               value={options.includes(safeValue) ? '' : safeValue}
               onChange={(e) => onChange(e.target.value)}
               onClick={(e) => e.stopPropagation()}
             />
           </div>
        </div>
      </FieldWrapper>
    );
  }

  // Standard Dropdown Mode
  return (
    <FieldWrapper label={field.label} description={field.description} required={field.required}>
      <div className="relative">
        {isCreatable ? (
          <input
             type="text"
             className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-xs focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm py-2 px-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pr-10"
             placeholder="Select or type..."
             value={safeValue}
             onChange={(e) => onChange(e.target.value)}
             list={`list-${field.key}`}
          />
        ) : (
          <div className="relative">
            <select
              className="block w-full appearance-none rounded-lg border-slate-300 dark:border-slate-600 shadow-xs focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm py-2 px-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-white pr-10"
              value={safeValue}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="" disabled>Select an option</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        )}
        {isCreatable && (
          <datalist id={`list-${field.key}`}>
            {options.map(opt => <option key={opt} value={opt} />)}
          </datalist>
        )}
      </div>

      {!useCompactMode && options.length > 0 && (
        <SuggestionsContainer>
          <span className="text-xs text-slate-400 dark:text-slate-500 self-center mr-1">Suggestions:</span>
          {options.slice(0, 5).map((opt) => (
            <SuggestionChip
              key={opt}
              label={opt}
              isActive={safeValue === opt}
              onClick={() => onChange(opt)}
            />
          ))}
        </SuggestionsContainer>
      )}
    </FieldWrapper>
  );
}


// 3. Tags Field
export const TagsField: React.FC<FieldProps> = ({ field, value, onChange }) => {
  const selectedTags: string[] = Array.isArray(value) ? value : [];
  const [inputValue, setInputValue] = useState('');
  const definedOptions = field.options || [];
  
  // Use defined options for mode switching to maintain UI stability
  const useCompactMode = definedOptions.length > 0 && definedOptions.length <= 10;

  // Merge defined options with any selected values that are not in the options list
  // This ensures custom tags appear as buttons in the list in compact mode
  const displayOptions = React.useMemo(() => {
    const merged = [...definedOptions];
    selectedTags.forEach(tag => {
      if (!merged.includes(tag)) {
        merged.push(tag);
      }
    });
    return merged;
  }, [definedOptions, selectedTags]);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(t => t !== tagToRemove));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      handleAddTag(tag);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  if (useCompactMode) {
    return (
      <FieldWrapper label={field.label} description={field.description} required={field.required}>
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 -mt-1 -mx-1 transition-colors">
          {displayOptions.map((opt) => {
            const isSelected = selectedTags.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleTag(opt)}
                className={twMerge(
                  "inline-flex items-center min-h-8 px-2 py-0.5 rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700 transition-all shadow-xs group",
                  isSelected
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-200 dark:hover:border-orange-800 cursor-pointer"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                )}
              >
                {isSelected && (
                  <div className="relative">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400 transition-opacity group-hover:opacity-0" />
                    <X className="w-3.5 h-3.5 mr-1.5 absolute inset-0 text-orange-600 dark:text-orange-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                )}
                {!isSelected && <Plus className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-500" />}
                 {opt}
              </button>
            );
          })}
          
          <div className="relative flex-1 min-w-[100px] max-w-xs">
             <input
                 type="text"
                 placeholder="Add custom..."
                 className="block w-full min-h-8 text-xs rounded-md border-slate-200 dark:border-slate-600 shadow-xs focus:border-indigo-500 dark:focus:border-indigo-400 py-0.5 px-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
                 onBlur={() => inputValue && handleAddTag(inputValue)}
               />
          </div>
        </div>
      </FieldWrapper>
    );
  }

  // Standard Tags Mode
  return (
    <FieldWrapper label={field.label} description={field.description} required={field.required}>
      <div className="min-h-[42px] block w-full rounded-lg border-slate-300 dark:border-slate-600 border bg-white dark:bg-slate-800 p-1.5 shadow-xs focus-within:border-indigo-500 dark:focus-within:border-indigo-400 sm:text-sm">
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map(tag => (
            <div 
              key={tag} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 animate-fadeIn hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-800 dark:hover:text-orange-300 cursor-pointer transition-colors"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1.5 text-indigo-600 dark:text-indigo-400 hover:text-orange-600 dark:hover:text-orange-400 focus:outline-none"
              >
                <X className="h-3.5 w-3.5 opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            </div>
          ))}
          <input
            type="text"
            className="flex-1 min-w-[100px] bg-transparent border-none p-1.5 focus:ring-0 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
            placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputValue && handleAddTag(inputValue)}
          />
        </div>
      </div>

      {definedOptions.length > 0 && (
        <SuggestionsContainer>
          <span className="text-xs text-slate-400 dark:text-slate-500 self-center mr-1">Popular:</span>
          {definedOptions.map((opt) => {
             const isSelected = selectedTags.includes(opt);
             return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleTag(opt)}
                className={twMerge(
                  "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors border group",
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 cursor-pointer line-through hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-200 dark:hover:border-orange-800 hover:line-through"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-800"
                )}
              >
                {isSelected && (
                  <div className="relative">
                    <Check className="w-3 h-3 mr-1 text-indigo-600 dark:text-indigo-400 transition-opacity group-hover:opacity-0" />
                    <X className="w-3 h-3 mr-1 absolute inset-0 text-orange-600 dark:text-orange-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                )}
                {!isSelected && <Plus className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />}
                {opt}
              </button>
            );
          })}
        </SuggestionsContainer>
      )}
    </FieldWrapper>
  );
};