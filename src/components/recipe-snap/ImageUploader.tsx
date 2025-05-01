'use client';

import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (dataUri: string) => void;
  isLoading: boolean;
}

export function ImageUploader({ onImageUpload, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreview(dataUri);
        onImageUpload(dataUri);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle non-image files or no file selected
      setPreview(null);
      // Optionally show an error message
    }
  }, [onImageUpload]);

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
  };

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFileChange]);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if the related target is outside the drop zone
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
       setDragging(false);
    } else if (!e.relatedTarget) { // Handle leaving the window/tab
       setDragging(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
    // Optionally call a prop function to clear results in the parent
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md">
      <CardContent className="p-6">
        <div
          className={cn(
            'border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out',
            dragging ? 'border-primary bg-accent/10' : 'hover:border-accent',
            'relative aspect-video flex flex-col items-center justify-center'
          )}
          onClick={!preview ? triggerFileInput : undefined} // Only trigger file input if no preview
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {preview ? (
            <>
              <Image
                src={preview}
                alt="Uploaded food preview"
                fill
                style={{ objectFit: 'contain' }}
                className="rounded-md"
                data-ai-hint="uploaded food photo"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 rounded-full h-8 w-8"
                onClick={clearPreview}
                aria-label="Remove image"
              >
                <X size={16} />
              </Button>
            </>
          ) : (
            <>
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </p>
            </>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileInputChange}
            accept="image/*"
            disabled={isLoading || !!preview} // Disable when loading or preview exists
          />
        </div>
        {/* Keep the button outside the drop zone */}
        {preview && (
             <Button
                onClick={triggerFileInput} // Re-purpose button to re-upload
                disabled={isLoading}
                className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
                {isLoading ? 'Analyzing...' : 'Upload Different Photo'}
             </Button>
        )}
      </CardContent>
    </Card>
  );
}
