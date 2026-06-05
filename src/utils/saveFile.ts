type SaveFileOptions = {
  description: string;
  extension: string;
  mimeType: string;
};

type FileSaveTarget = {
  write: (blob: Blob) => Promise<void>;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      accept: Record<string, string[]>;
      description: string;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      close: () => Promise<void>;
      write: (blob: Blob) => Promise<void>;
    }>;
  }>;
};

export async function createFileSaveTarget(
  filename: string,
  options: SaveFileOptions,
): Promise<FileSaveTarget | null> {
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker;

  if (picker) {
    try {
      const handle = await picker.call(window, {
        suggestedName: filename,
        types: [
          {
            accept: { [options.mimeType]: [options.extension] },
            description: options.description,
          },
        ],
      });

      return {
        async write(blob) {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        },
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }

      throw error;
    }
  }

  return {
    async write(blob) {
      downloadBlob(blob, filename);
    },
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}
