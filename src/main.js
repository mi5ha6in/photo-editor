import Cropper from "cropperjs";

const PHOTO_EDITOR_NAME = ".photo-editor";
const UPLOAD_INPUT_NAME = ".photo-editor__upload-input";
const EDITOR_DIALOG_NAME = ".photo-editor__dialog";
const CLOSE_BUTTON_NAME = ".photo-editor__close";
const CROPPER_CONTAINER_NAME = ".photo-editor__image";
const RECOMMENDED_IMAGE_RESOLUTION_NAME = "[data-recommended-image-resolution]";
const ORIGINAL_IMAGE_RESOLUTION_NAME = "[data-original-image-resolution]";
const ORIGINAL_SIZE_IMAGE_NAME = "[data-original-size-image]";
const CROPPED_IMAGE_RESOLUTION_NAME = "[data-cropped-image-resolution]";
const CROPPED_IMAGE_SIZE_NAME = "[data-cropped-image-size]";
const REQUIREMENTS_ITEM_ERROR_NAME = ".photo-editor__requirements-item_error";
const APPLY_BUTTON_NAME = ".photo-editor__controls-button_apply";
const CANCEL_BUTTON_NAME = ".photo-editor__controls-button_cancel";
const RESULT_TEMPLATE_NAME = "#result-template";
const EDITOR_TEMPLATE_NAME = "#editor-template";
const EDITOR_DIALOG_CONTENT_NAME = ".photo-editor__dialog-content";

const defaultConfig = {
  recommendedImageWidth: 1600,
  recommendedImageHeight: 900,
  aspectRatio: 1.7777777777777777,
  urlFileUpload: "public/result.json",
};

const currentImageData = {
  originalWidth: 0,
  originalHeight: 0,
  originalSize: 0,
  croppedWidth: 0,
  croppedHeight: 0,
};

const initPhotoEditor = () => {
  const photoEditor = document.querySelector(PHOTO_EDITOR_NAME);
  const uploadInput = photoEditor.querySelector(UPLOAD_INPUT_NAME);
  const editorDialog = photoEditor.querySelector(EDITOR_DIALOG_NAME);
  const closeButton = editorDialog.querySelector(CLOSE_BUTTON_NAME);
  const editorTemplate = document.querySelector(EDITOR_TEMPLATE_NAME);
  const editorDialogContent = editorDialog.querySelector(
    EDITOR_DIALOG_CONTENT_NAME
  );
  const resultTemplate = document.querySelector(RESULT_TEMPLATE_NAME);

  if (
    !photoEditor ||
    !uploadInput ||
    !editorDialog ||
    !closeButton ||
    !editorTemplate ||
    !editorDialogContent ||
    !resultTemplate
  ) {
    console.error(
      `Не найден один из элементов:
      ${PHOTO_EDITOR_NAME},
      ${UPLOAD_INPUT_NAME},
      ${EDITOR_DIALOG_NAME},
      ${CLOSE_BUTTON_NAME},
      ${EDITOR_TEMPLATE_NAME},
      ${EDITOR_DIALOG_CONTENT_NAME},
      ${RESULT_TEMPLATE_NAME},`
    );
    return;
  }

  const getConfig = () => {
    try {
      const customConfig = photoEditor.dataset.config
        ? JSON.parse(photoEditor.dataset.config)
        : {};

      return { ...defaultConfig, ...customConfig };
    } catch (error) {
      console.error(
        "Ошибка парсинга конфига, используется конфиг по умолчанию",
        error
      );
      return defaultConfig;
    }
  };

  const initialData = getConfig();

  const handleFileInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showLoader();
    try {
      const dataUrl = await readFileAsDataURL(file);
      await prepareImage(dataUrl, file);
    } catch (error) {
      console.error("Ошибка при загрузке изображения:", error);
    }
    hideLoader();
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
      const image = new Image();
      image.src = dataUrl;
      image.onload = () => {
        document.body.style.overflow = "hidden";
        editorDialog.showModal();
        initCropper(image, file);
        resolve();
      };
    });
  };

  const initCropper = (image, file) => {
    const editor = createEditor(image, file);
    const applyButton = editor.querySelector(APPLY_BUTTON_NAME);
    const cancelButton = editor.querySelector(CANCEL_BUTTON_NAME);
    const croppedImageResolution = editor.querySelector(
      CROPPED_IMAGE_RESOLUTION_NAME
    );

    editorDialogContent.replaceChildren(editor);

    const cropper = new Cropper(image, {
      container: CROPPER_CONTAINER_NAME,
    });

    const cropperSelection = cropper.getCropperSelection();
    const cropperImage = cropper.getCropperImage();
    const cropperCanvas = cropper.getCropperCanvas();

    cropperCanvas.querySelector("cropper-shade").remove();
    cropperSelection.outlined = true;
    cropperSelection.aspectRatio = initialData.aspectRatio;

    cropperSelection.addEventListener("change", (event) => {
      onCropperSelectionChange(
        event,
        cropperCanvas,
        cropperImage,
        croppedImageResolution
      );
    });

    applyButton.onclick = async () => {
      showLoader();
      try {
        const croppedImage = await cropperSelection.$toCanvas({
          beforeDraw: (context) => {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
          },
        });

        const blob = await new Promise((resolve) => {
          croppedImage.toBlob((blob) => resolve(blob), file.type, 1);
        });

        const formData = new FormData();
        formData.append("image", blob, file.name);
        formData.append("imageName", file.name);
        formData.append("imageType", file.type);
        formData.append("originalWidth", currentImageData.originalWidth);
        formData.append("originalHeight", currentImageData.originalHeight);
        formData.append("croppedWidth", currentImageData.croppedWidth);
        formData.append("croppedHeight", currentImageData.croppedHeight);

        const uploadImage = async () => {
          try {
            const response = await fetch(initialData.urlFileUpload, {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Ошибка сервера");
            }

            return await response.json();
          } catch (error) {
            throw new Error("Ошибка при загрузке изображения");
          }
        };

        await uploadImage();

        const resultData = await uploadImage(file);
        const resultItem = createResultItem(resultData);
        editorDialogContent.replaceChildren(resultItem);
      } catch (e) {
        alert("Ошибка при обработке изображения");
      }
      hideLoader();
    };

    cancelButton.onclick = () => {
      closeDialog();
    };
  };

  const createEditor = (image, file) => {
    const editor = editorTemplate.content.cloneNode(true);

    const recommendedImageResolution = editor.querySelector(
      RECOMMENDED_IMAGE_RESOLUTION_NAME
    );
    const originalImageResolution = editor.querySelector(
      ORIGINAL_IMAGE_RESOLUTION_NAME
    );
    const originalSizeImage = editor.querySelector(ORIGINAL_SIZE_IMAGE_NAME);
    const requirementsItemError = editor.querySelector(
      REQUIREMENTS_ITEM_ERROR_NAME
    );

    currentImageData.originalWidth = image.naturalWidth;
    currentImageData.originalHeight = image.naturalHeight;
    currentImageData.originalSize = formatFileSize(file.size);

    recommendedImageResolution.textContent = `${initialData.recommendedImageWidth}x${initialData.recommendedImageHeight}`;
    originalImageResolution.textContent = `${image.naturalWidth}x${image.naturalHeight}`;
    originalSizeImage.textContent = formatFileSize(file.size);

    if (
      initialData.recommendedImageWidth > image.naturalWidth ||
      initialData.recommendedImageHeight > image.naturalHeight
    ) {
      requirementsItemError.textContent =
        "Загружаемое изображение слишком мало - попробуйте найти другое";
      requirementsItemError.classList.remove("hidden");
    } else {
      requirementsItemError.textContent = "";
      requirementsItemError.classList.add("hidden");
    }

    return editor;
  };

  const createResultItem = (result) => {
    const resultItem = resultTemplate.content.cloneNode(true);
    resultItem.querySelector("img").src = result.image;

    resultItem.querySelector(CROPPED_IMAGE_SIZE_NAME).textContent =
      formatFileSize(result.size);

    resultItem.querySelector(
      CROPPED_IMAGE_RESOLUTION_NAME
    ).textContent = `${result.width}x${result.height}`;

    resultItem.querySelector(ORIGINAL_SIZE_IMAGE_NAME).textContent =
      currentImageData.originalSize;

    resultItem.querySelector(
      ORIGINAL_IMAGE_RESOLUTION_NAME
    ).textContent = `${currentImageData.originalWidth}x${currentImageData.originalHeight}`;

    return resultItem;
  };

  const closeDialog = () => {
    document.body.style.overflow = "";
    editorDialog.close();
    uploadInput.value = "";
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

  const onCropperSelectionChange = (
    event,
    cropperCanvas,
    cropperImage,
    croppedImageResolution
  ) => {
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

    currentImageData.croppedWidth = selection.width;
    currentImageData.croppedHeight = selection.height;
  };

  const showLoader = () => {
    let loader = document.querySelector(".photo-editor__loader");
    if (!loader) {
      const loaderTemplate = document.querySelector("#loader-template");
      loader = loaderTemplate.content.firstElementChild.cloneNode(true);
      document.body.appendChild(loader);
    }
  };

  function hideLoader() {
    const loader = document.querySelector(".photo-editor__loader");
    if (loader) loader.remove();
  }

  uploadInput.addEventListener("change", handleFileInputChange);

  closeButton.addEventListener("click", closeDialog);

  editorDialog.addEventListener("close", () => {
    closeDialog();
  });
};

document.addEventListener("DOMContentLoaded", initPhotoEditor);
