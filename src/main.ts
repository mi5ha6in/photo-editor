import 'cropperjs';
import './style.css';

const uploadInput = document.getElementById('upload') as HTMLInputElement;
const editorDialog = document.querySelector('.photo-editor__editor') as HTMLDialogElement;
const closeButton = document.querySelector('.photo-editor__close') as HTMLButtonElement;

if (uploadInput && editorDialog && closeButton) {
  uploadInput.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const cropperImage = editorDialog.querySelector('cropper-image');
        if (cropperImage && e.target?.result) {
          cropperImage.setAttribute('src', e.target.result as string);
          editorDialog.showModal();
        }
      };
      reader.readAsDataURL(file);
    }
  });

  const closeDialog = () => {
    editorDialog.close();
    uploadInput.value = '';
  };

  closeButton.addEventListener('click', closeDialog);

  editorDialog.addEventListener('close', () => {
    closeDialog();
  });

}