import Cropper from "cropperjs";

const UPLOAD_INPUT_NAME = ".photo-editor__upload-input";
const EDITOR_DIALOG_NAME = ".photo-editor__editor";
const CLOSE_BUTTON_NAME = ".photo-editor__close";

const initPhotoEditor = () => {
  const uploadInput = document.querySelector(UPLOAD_INPUT_NAME);
  const editorDialog = document.querySelector(EDITOR_DIALOG_NAME);
  const closeButton = document.querySelector(CLOSE_BUTTON_NAME);

  if (!uploadInput || !editorDialog || !closeButton) {
    console.error(
      `Не найдены элементы: ${UPLOAD_INPUT_NAME}, ${EDITOR_DIALOG_NAME}, ${CLOSE_BUTTON_NAME}`
    );
    return;
  }

  const image = new Image();
  const cropper = new Cropper(image, {
    container: ".photo-editor__image",
  });

  const cropperCanvas = cropper.getCropperCanvas();
  const cropperSelection = cropper.getCropperSelection();
  const cropperImage = cropper.getCropperImage();

  uploadInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        image.src = e.target.result;
        image.onload = () => {
          editorDialog.showModal();
          cropper.getCropperImage().src = image.src;
          cropper.getCropperSelection().$render();
        };
      };
    }
  });

  const closeDialog = () => {
    editorDialog.close();
    uploadInput.value = "";
  };

  closeButton.addEventListener("click", closeDialog);

  editorDialog.addEventListener("close", () => {
    closeDialog();
  });
};

initPhotoEditor();
