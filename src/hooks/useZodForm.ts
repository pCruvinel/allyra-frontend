import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'

/**
 * Hook que integra react-hook-form + zodResolver.
 * Reduz boilerplate: em vez de configurar resolver + defaultValues manualmente,
 * basta passar o schema e os defaults.
 *
 * @example
 * const { register, control, handleSubmit, errors, reset } = useZodForm(
 *   createPatientSchema,
 *   { name: '', email: '', cpf: '', phone: '', birthDate: '', insurance: '' }
 * )
 */
export function useZodForm<TOutput extends FieldValues, TInput = TOutput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>,
  defaultValues: TOutput,
  formOptions?: Omit<UseFormProps<TOutput>, 'resolver' | 'defaultValues'>
) {
  const form = useForm<TOutput>({
    /* eslint-disable @typescript-eslint/no-explicit-any */
    resolver: zodResolver(schema as any) as any,
    defaultValues: defaultValues as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */
    mode: 'onBlur', // Valida ao sair do campo (UX amigável)
    ...formOptions,
  })

  return {
    ...form,
    /** Atalho para formState.errors */
    errors: form.formState.errors,
    /** Atalho para formState.isValid */
    isValid: form.formState.isValid,
    /** Atalho para formState.isSubmitting */
    isSubmitting: form.formState.isSubmitting,
  }
}
