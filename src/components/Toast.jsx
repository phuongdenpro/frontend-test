import { toast } from 'react-toastify';
import { css } from 'glamor';

const customToast = {
  success(msg, options = {}) {
    return toast.success(msg, {
      ...options,
      className: 'toast-success-container toast-success-container-after',
      theme:'colored',
      progressClassName: css({
        background: '#07bc0c',
      }),
    });
  },
  error(msg, options = {}) {
    return toast.error(msg, {
      ...options,
      className: 'toast-error-container toast-error-container-after',
      theme:'colored',
      progressClassName: css({
        background: '#e74c3c',
      }),
    });
  },
  info(msg, options = {}) {
    return toast.info(msg, {
      ...options,
      className: 'toast-info-container toast-info-container-after',
      theme:'colored',
      progressClassName: css({
        background: '#3498db',
      }),
    });
  },
  warning(msg, options = {}) {
    return toast.warning(msg, {
      ...options,
      className: 'toast-warning-container toast-warning-container-after',
      theme:'colored',
      progressClassName: css({
        background: '#f1c40f',
      }),
    });
  },
};


export default customToast;
