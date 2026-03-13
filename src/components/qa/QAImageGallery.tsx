import { QAImagePreview } from "@/components/qa/QAImagePreview";

interface QAImageGalleryProps {
  images: string[];
  altPrefix: string;
}

export function QAImageGallery({
  images,
  altPrefix,
}: QAImageGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((imageUrl, index) => (
        <QAImagePreview
          key={`${imageUrl}-${index}`}
          src={imageUrl}
          alt={`${altPrefix} ${index + 1}`}
        />
      ))}
    </div>
  );
}
