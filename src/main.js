import Cropper from "cropperjs";

const UPLOAD_INPUT_NAME = ".photo-editor__upload-input";
const EDITOR_DIALOG_NAME = ".photo-editor__dialog";
const CLOSE_BUTTON_NAME = ".photo-editor__close";
const CROPPER_CONTAINER_NAME = ".photo-editor__image";
const RECOMMENDED_IMAGE_RESOLUTION_NAME = "[data-recommended-image-resolution]";
const ORIGINAL_IMAGE_RESOLUTION_NAME = "[data-original-image-resolution]";
const ORIGINAL_SIZE_IMAGE_NAME = "[data-original-size-image]";
const CROPPED_IMAGE_RESOLUTION_NAME = "[data-cropped-image-resolution]";
const REQUIREMENTS_ITEM_ERROR_NAME = ".photo-editor__requirements-item--error";
const APPLY_BUTTON_NAME = ".photo-editor__controls-button_apply";
const CANCEL_BUTTON_NAME = ".photo-editor__controls-button_cancel";

const initialData = {
  recommendedSizeImage: {
    width: 1280,
    height: 800,
  },
  aspectRatio: 1.5,
};

const initPhotoEditor = () => {
  const uploadInput = document.querySelector(UPLOAD_INPUT_NAME);
  const editorDialog = document.querySelector(EDITOR_DIALOG_NAME);
  const closeButton = editorDialog.querySelector(CLOSE_BUTTON_NAME);
  const recommendedImageResolution = editorDialog.querySelector(
    RECOMMENDED_IMAGE_RESOLUTION_NAME
  );
  const originalImageResolution = editorDialog.querySelector(
    ORIGINAL_IMAGE_RESOLUTION_NAME
  );
  const originalSizeImage = editorDialog.querySelector(
    ORIGINAL_SIZE_IMAGE_NAME
  );
  const requirementsItemError = editorDialog.querySelector(
    REQUIREMENTS_ITEM_ERROR_NAME
  );
  const croppedImageResolution = editorDialog.querySelector(
    CROPPED_IMAGE_RESOLUTION_NAME
  );
  const applyButton = editorDialog.querySelector(APPLY_BUTTON_NAME);
  const cancelButton = editorDialog.querySelector(CANCEL_BUTTON_NAME);

  if (
    !uploadInput ||
    !editorDialog ||
    !closeButton ||
    !recommendedImageResolution ||
    !originalSizeImage ||
    !originalImageResolution ||
    !requirementsItemError ||
    !croppedImageResolution ||
    !applyButton ||
    !cancelButton
  ) {
    console.error(
      `Не найден один из элементов: 
      ${UPLOAD_INPUT_NAME},
      ${EDITOR_DIALOG_NAME},
      ${CLOSE_BUTTON_NAME},
      ${RECOMMENDED_IMAGE_RESOLUTION_NAME},
      ${ORIGINAL_SIZE_IMAGE_NAME},
      ${ORIGINAL_IMAGE_RESOLUTION_NAME},
      ${REQUIREMENTS_ITEM_ERROR_NAME},
      ${CROPPED_IMAGE_RESOLUTION_NAME},
      ${APPLY_BUTTON_NAME},
      ${CANCEL_BUTTON_NAME}`
    );
    return;
  }

  const image = new Image();

  const handleFileInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataURL(file);
      await prepareImage(dataUrl, file);
    } catch (error) {
      console.error("Ошибка при загрузке изображения:", error);
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
    });
  };

  const prepareImage = (dataUrl, file) => {
    return new Promise((resolve) => {
      image.src = dataUrl;
      image.onload = () => {
        document.body.style.overflow = "hidden";
        setInitialData(file);
        editorDialog.showModal();
        initCropper(image, file);
        resolve();
      };
    });
  };

  const initCropper = (image, file) => {
    const cropper = new Cropper(image, {
      container: CROPPER_CONTAINER_NAME,
    });

    const cropperSelection = cropper.getCropperSelection();
    const cropperImage = cropper.getCropperImage();
    const cropperCanvas = cropper.getCropperCanvas();

    cropperCanvas.querySelector("cropper-shade").remove();
    cropperSelection.outlined = true;
    cropperSelection.aspectRatio = initialData.aspectRatio;

    // TODO: Добавить обработку изменения выделения
    // баги с округлением, временно отключено
    // cropperSelection.addEventListener("change", (event) => {
    //   onCropperSelectionChange(event, cropperCanvas, cropperImage);
    // });

    applyButton.onclick = async () => {
      const croppedImage = await cropperSelection.$toCanvas({
        beforeDraw: (context) => {
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
        },
      });

      const dataURL = croppedImage.toDataURL(file.type, 1);
      fetch("/api/compress-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: dataURL,
          imageName: file.name,
          imageType: file.type,
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Успех:", data))
        .catch((error) => console.error("Ошибка:", error));
    };
  };

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

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} КБ`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
    }
  };

  const inSelection = (selection, maxSelection) => {
    return (
      selection.x >= maxSelection.x &&
      selection.y >= maxSelection.y &&
      selection.x + selection.width <= maxSelection.x + maxSelection.width &&
      selection.y + selection.height <= maxSelection.y + maxSelection.height
    );
  };

  const onCropperSelectionChange = (event, cropperCanvas, cropperImage) => {
    const cropperCanvasRect = cropperCanvas.getBoundingClientRect();
    const selection = event.detail;

    const cropperImageRect = cropperImage.getBoundingClientRect();
    const maxSelection = {
      x: cropperImageRect.left - cropperCanvasRect.left,
      y: cropperImageRect.top - cropperCanvasRect.top,
      width: cropperImageRect.width,
      height: cropperImageRect.height,
    };
    croppedImageResolution.textContent = `${selection.width}x${selection.height}`;
    if (!inSelection(selection, maxSelection)) {
      event.preventDefault();
    }
  };

  const setInitialData = (file) => {
    recommendedImageResolution.textContent = `${initialData.recommendedSizeImage.width}x${initialData.recommendedSizeImage.height}`;
    originalImageResolution.textContent = `${image.naturalWidth}x${image.naturalHeight}`;
    originalSizeImage.textContent = formatFileSize(file.size);

    if (
      initialData.recommendedSizeImage.width > image.naturalWidth ||
      initialData.recommendedSizeImage.height > image.naturalHeight
    ) {
      requirementsItemError.hidden = false;
    } else {
      requirementsItemError.hidden = true;
    }
  };

  uploadInput.addEventListener("change", handleFileInputChange);

  closeButton.addEventListener("click", closeDialog);

  editorDialog.addEventListener("close", () => {
    closeDialog();
  });

  cancelButton.addEventListener("click", () => {
    closeDialog();
  });
};

document.addEventListener("DOMContentLoaded", initPhotoEditor);
