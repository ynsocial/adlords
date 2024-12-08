import { useState, useCallback } from 'react';
import { useFormik, FormikConfig, FormikValues } from 'formik';
import { useAuth } from '../context/AuthContext';

export const useForm = <T extends FormikValues>(config: FormikConfig<T>) => {
  const { clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (values: T, formikHelpers: any) => {
      setIsSubmitting(true);
      clearError();
      try {
        await config.onSubmit(values, formikHelpers);
      } finally {
        setIsSubmitting(false);
      }
    },
    [config.onSubmit, clearError]
  );

  const formik = useFormik({
    ...config,
    onSubmit: handleSubmit,
  });

  return {
    ...formik,
    isSubmitting,
  };
};

export default useForm;
