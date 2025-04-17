import { getIcon } from "@iconify/react";

export   const fetchSvgText = async (iconName: string): Promise<string> => {
  const iconData = getIcon(`gtp:${iconName}`);

  if (!iconData) {
    throw new Error(`Icon "${iconName}" not found in the Iconify registry.`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconData.width || 24} ${iconData.height || 24}" fill="currentColor">${iconData.body}</svg>`;
};

export const svgToPngBlob = async (svgText: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const blobUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.src = blobUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(blobUrl);
        return reject(new Error("Could not get canvas context"));
      }
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(blobUrl);
        if (!pngBlob) {
          return reject(new Error("Could not create PNG blob"));
        }
        resolve(pngBlob);
      }, "image/png");
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      reject(err);
    };
  });
};

export const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Could not convert blob to ArrayBuffer"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};