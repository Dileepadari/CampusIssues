import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
