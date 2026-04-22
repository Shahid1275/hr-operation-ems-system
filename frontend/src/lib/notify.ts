import { toast, type ToastOptions } from 'react-toastify';

const base: ToastOptions = {
  autoClose: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const notify = {
  success: (message: string) => toast.success(message, base),
  error: (message: string) => toast.error(message, { ...base, autoClose: 4000 }),
  info: (message: string) => toast.info(message, base),
  warning: (message: string) => toast.warning(message, base),
};
