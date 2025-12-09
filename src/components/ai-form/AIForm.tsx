import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, SelectField, TagsField, type FormField } from './FormFields';
import { Loader2 } from 'lucide-react';


export type FormData = Record<string, any>;

export interface AIFormProps {
  title?: string;
  fields: FormField[];
  initialData?: FormData;
  onChange?: (data: FormData) => void;
  onSubmit?: (data: FormData) => void;
  isGenerating?: boolean;
  autoPickValue?: boolean;
  submitLabel?: string;
}
const getDefaultValues = ({ initialData, fields, autoPickValue }: { initialData: FormData, fields: FormField[], autoPickValue: boolean }) => {
  const defaults: Record<string, any> = { ...initialData };
  
  if (autoPickValue) {
    fields.forEach(field => {
      // Only set auto-picked value if no initial data exists for this key
      if (defaults[field.key] === undefined && field.options && field.options.length > 0) {
        if (field.type === 'tags') {
          defaults[field.key] = [field.options[0]];
        } else {
          defaults[field.key] = field.options[0];
        }
      }
    });
  }
  return defaults;
};

const AIForm: React.FC<AIFormProps> = ({ 
  title,
  fields, 
  initialData = {}, 
  onChange, 
  onSubmit,
  isGenerating = false,
  autoPickValue = false,
  submitLabel = 'Submit Form'
}) => {
  // Determine default values based on autoPickValue and initialData

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: getDefaultValues({ initialData, fields, autoPickValue })
  });

  // Watch for changes to report back to parent
  useEffect(() => {
    if (onChange) {
      const subscription = watch((value) => { onChange(value as any); });
      return () => subscription.unsubscribe();
    }
  }, [watch, onChange]);

  // Handle external updates to fields or initialData
  // useEffect(() => {
  //   reset(getDefaultValues());
  // }, [fields, initialData, autoPickValue, reset]);


  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">AI is generating form structure...</p>
      </div>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 border border-slate-200 rounded-lg bg-slate-50">
        <p>No fields defined.</p>
      </div>
    );
  }

  return (
    <div className="">
      {title && (
        <div className="mb-2">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{title}</h2>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit || (() => {}))} className="space-y-1">
        <div className="flex flex-col gap-y-1">
          {fields.map((field) => (
            <div className=''>
              <Controller
                key={field.key}
                name={field.key}
                control={control}
                rules={{ required: field.required }}
                render={({ field: { onChange, value } }) => {
                  switch (field.type) {
                    case 'text':
                      return <TextField field={field} value={value} onChange={onChange} />;
                    case 'select':
                      return <SelectField field={field} value={value} onChange={onChange} />;
                    case 'tags':
                      return <TagsField field={field} value={value} onChange={onChange} />;
                    default:
                      return <div className="text-red-500 text-xs">Unknown field type: {field.type}</div>;
                  }
                }}
              />
            </div>
          ))}

          {onSubmit && <div className="pt-1 mt-0 border-t border-slate-200 flex justify-start">
            <button
              type="submit"
              className="inline-flex items-center px-3 py-1 min-h-8 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {submitLabel}
            </button>
          </div>}
        </div>
      </form>
    </div>
  );
};

export default AIForm;