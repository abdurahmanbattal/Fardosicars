import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';

export function ImageUploader({ onUpload }: { onUpload: (urls: string[]) => void }) {

  const onDrop = useCallback(async (files: File[]) => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from('cars')
        .upload(fileName, file);

      if (!error) {
        const { data } = supabase.storage
          .from('cars')
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      }
    }

    onUpload(uploadedUrls);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-red-600 rounded-xl p-8 text-center cursor-pointer bg-gray-900 hover:bg-gray-800 transition"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>افلت الصور هنا...</p>
      ) : (
        <p>اسحب الصور هنا أو اضغط للاختيار</p>
      )}
    </div>
  );
}
