import Swal from 'sweetalert2';

// SweetAlert2 in the BarBuddy palette (navy / gold / cream, Playfair + Inter).
// Styles live in index.css under ".bb-swal".
const base = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  showClass: { popup: 'bb-swal-in' },
  hideClass: { popup: 'bb-swal-out' },
  customClass: {
    popup: 'bb-swal',
    title: 'bb-swal-title',
    htmlContainer: 'bb-swal-text',
    confirmButton: 'bb-swal-btn bb-swal-confirm',
    cancelButton: 'bb-swal-btn bb-swal-cancel',
    icon: 'bb-swal-icon',
  },
});

// "Are you sure?" dialog. Resolves true only when the user confirms.
export async function confirmAction({ title, text, html, confirmText = 'Yes, continue', cancelText = 'Cancel', danger = false, icon }) {
  const result = await base.fire({
    title,
    text: html ? undefined : text,
    html,
    icon: icon ?? (danger ? 'warning' : 'question'),
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: 'bb-swal',
      title: 'bb-swal-title',
      htmlContainer: 'bb-swal-text',
      confirmButton: `bb-swal-btn ${danger ? 'bb-swal-danger' : 'bb-swal-confirm'}`,
      cancelButton: 'bb-swal-btn bb-swal-cancel',
      icon: 'bb-swal-icon',
    },
  });
  return result.isConfirmed;
}

// Asks for text before a change (e.g. an annotation). Resolves the text or null.
export async function promptText({ title, text, placeholder, confirmText = 'Save', minLength = 1, initial = '' }) {
  const result = await base.fire({
    title,
    text,
    input: 'textarea',
    inputValue: initial,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    inputValidator: (value) => (value.trim().length < minLength ? `Please write at least ${minLength} characters.` : undefined),
  });
  return result.isConfirmed ? result.value.trim() : null;
}

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
  customClass: { popup: 'bb-swal bb-swal-toast', title: 'bb-swal-toast-title' },
});

export const toastSuccess = (title) => toast.fire({ icon: 'success', title });
export const toastError = (title) => toast.fire({ icon: 'error', title, timer: 4500 });
