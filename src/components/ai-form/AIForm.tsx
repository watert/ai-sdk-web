import React, { useEffect, useMemo } from 'react';
import z from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { TextField, SelectField, TagsField, type FormField } from './FormFields';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';


// 基础字段属性
const BaseFieldSchema = z.object({
  key: z.string().describe("字段的唯一标识符，用于输出数据的 key"),
  label: z.string().describe("字段显示的简短标题 (Label)"),
  description: z.string().optional().describe("字段的补充说明或提示 (Tooltip/Placeholder)"),
  required: z.boolean().default(true).describe("是否必填"),
});

// 1. Text 组件
const TextFieldSchema = BaseFieldSchema.extend({
  type: z.literal('text'),
  options: z.array(z.string()).min(1).describe("AI 生成的推荐值列表，必填，用于加速输入"),
  defaultValue: z.string().optional(),
});

// 2. Select 组件
const SelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(z.string()).min(1).describe("下拉选项列表"),
  creatable: z.boolean().optional().describe("是否允许用户输入选项之外的值"),
  defaultValue: z.string().optional(),
});

// 3. Tags 组件
const TagsFieldSchema = BaseFieldSchema.extend({
  type: z.literal('tags'),
  options: z.array(z.string()).min(1).describe("推荐的标签列表"),
  creatable: z.boolean().optional().describe("是否允许用户创建新标签"),
  defaultValue: z.array(z.string()).optional(),
});

// 联合类型
const FormFieldSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  SelectFieldSchema,
  TagsFieldSchema,
]);

// 最终 Tool 的参数 Schema
export const GenerateFormSchema = z.object({
  title: z.string().describe("表单的标题，概括本次任务"),
  fields: z.array(FormFieldSchema).describe("表单字段列表"),
  submitLabel: z.string().optional().describe("提交按钮的文案，如 'Generate', 'Search', 'Run'"),
});

export function parsePartialAIFormData(partialData: Partial<z.infer<typeof GenerateFormSchema>>) {
  return { ...partialData, fields: partialData.fields?.filter(f => {
    return f?.options?.filter?.(r => r).length > 1 && FormFieldSchema.safeParse(f).success;
  })}
}

export type FormData = Record<string, any>;

export interface AIFormProps {
  title?: string;
  fields: FormField[];
  initialData?: FormData;
  onChange?: (data: FormData) => void;
  onSubmit?: (data: FormData) => void;
  streaming?: boolean;
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
  fields: _fields, 
  initialData = {}, 
  onChange, 
  onSubmit,
  streaming = false,
  autoPickValue = false,
  submitLabel = 'Submit Form'
}) => {
  const fields = _fields;
  
  const { control, handleSubmit, formState: { isValid }, reset, watch, setValue, getValues } = useForm({
    defaultValues: getDefaultValues({ initialData, fields, autoPickValue })
  });
  const submitDisabled = !isValid || streaming;
  useEffect(() => {
    if (!streaming || !autoPickValue) return;
    const lastField = fields[fields.length - 1];
    const lastFieldValue = getValues(lastField.key);
    // console.log('effect', lastField, lastFieldValue, lastField.options);
    if (typeof lastFieldValue === 'undefined' && lastField.options?.length) {
      const isTagsType = lastField.type === 'tags';
      const val = lastField.options[0];
      setValue(lastField.key, (isTagsType ? [val] : val));
    }
  }, [fields, streaming, autoPickValue, getValues, setValue]);

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


  // if (streaming) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
  //       <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
  //       <p className="text-sm font-medium">AI is generating form structure...</p>
  //     </div>
  //   );
  // }

  if (!fields || fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-8 text-slate-400 border border-slate-200 rounded-lg bg-slate-50">
        <p>No fields defined.</p>
      </div>
    );
  }

  return (
    <div className="">
      {title && (
        <div className="mb-2">
          <h2 className="text-md font-bold text-slate-900 mb-1">{title}</h2>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit || (() => {}))} className="space-y-1">
        <div className="flex flex-col gap-y-1">
          {fields.map((field) => (
            <div className=''>
              <Controller
                key={field.key} name={field.key}
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

          {onSubmit && !streaming && <div className="pt-1 mt-0 border-t border-slate-200 flex justify-start">
            <button
              disabled={submitDisabled}
              type="submit"
              className={twMerge("inline-flex items-center px-3 py-1 min-h-8 border border-indigo-500 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors", submitDisabled ? "cursor-not-allowed opacity-50" : "")}
            >
              {/* {streaming && <Loader2 className="w-4 h-4 animate-spin text-white mr-2" />} */}
              {submitLabel}
            </button>
          </div>}
        </div>
      </form>
    </div>
  );
};

export default AIForm;