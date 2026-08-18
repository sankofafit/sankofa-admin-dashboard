export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      maxSizeKB = 800,
    } = options;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');

        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;

        const tryCompress = () => {
          const compressed = canvas.toDataURL('image/jpeg', currentQuality);

          const sizeKB = Math.round((compressed.length * 3) / 4 / 1024);

          console.log(`Compressed size: ${sizeKB}KB at quality ${currentQuality}`);

          if (sizeKB > maxSizeKB && currentQuality > 0.1) {
            currentQuality -= 0.1;
            tryCompress();
          } else {
            fetch(compressed)
              .then((res) => res.blob())
              .then((blob) => {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, '.jpg'),
                  { type: 'image/jpeg' },
                );

                const finalSizeKB = Math.round(compressedFile.size / 1024);
                const originalSizeKB = Math.round(file.size / 1024);

                console.log(
                  `Original: ${originalSizeKB}KB → Compressed: ${finalSizeKB}KB (${Math.round(
                    (1 - finalSizeKB / originalSizeKB) * 100,
                  )}% reduction)`,
                );

                resolve(compressedFile);
              })
              .catch(reject);
          }
        };

        tryCompress();
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
  });
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
