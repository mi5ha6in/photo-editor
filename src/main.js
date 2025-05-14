import Cropper from "cropperjs";

const UPLOAD_INPUT_NAME = ".photo-editor__upload-input";
const EDITOR_DIALOG_NAME = ".photo-editor__dialog";
const CLOSE_BUTTON_NAME = ".photo-editor__close";
const CROPPER_CONTAINER_NAME = ".photo-editor__image";

const initPhotoEditor = () => {
  const uploadInput = document.querySelector(UPLOAD_INPUT_NAME);
  const editorDialog = document.querySelector(EDITOR_DIALOG_NAME);
  const closeButton = editorDialog.querySelector(CLOSE_BUTTON_NAME);

  if (!uploadInput || !editorDialog || !closeButton) {
    console.error(
      `Не найдены элементы: ${UPLOAD_INPUT_NAME}, ${EDITOR_DIALOG_NAME}, ${CLOSE_BUTTON_NAME},`
    );
    return;
  }

  const image = new Image();

  uploadInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        image.src = e.target.result;
        image.onload = () => {
          document.body.style.overflow = "hidden";
          editorDialog.showModal();
          const cropper = new Cropper(image, {
            container: CROPPER_CONTAINER_NAME,
          });
        };
      };
    }
  });

  const closeDialog = () => {
    document.body.style.overflow = "";
    editorDialog.close();
    uploadInput.value = "";
    rerenderNode(CROPPER_CONTAINER_NAME);
  };

  const rerenderNode = (selector) => {
    const oldNode = document.querySelector(selector);
    if (!oldNode) {
      console.warn(`Элемент с селектором "${selector}" не найден.`);
      return;
    }

    const newNode = oldNode.cloneNode(false);
    oldNode.replaceWith(newNode);
  };

  closeButton.addEventListener("click", closeDialog);

  editorDialog.addEventListener("close", () => {
    closeDialog();
  });
};

document.addEventListener("DOMContentLoaded", initPhotoEditor);
