"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage } from "@/app/actions";
import { UploadCloud, X, LoaderCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type UploaderProps = {
  onDataExtracted: (data: any) => void;
  isProcessing: boolean;
  setProcessing: (isProcessing: boolean) => void;
};

export function Uploader({ onDataExtracted, isProcessing, setProcessing }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
  };
  
  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    setProcessing(true);
    try {
      const result = await analyzeImage(preview);
      if (result.error) {
        throw new Error(result.error);
      }
      onDataExtracted(result.data);
      toast({
          title: "Analysis Complete",
          description: "Data has been successfully extracted.",
          action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="h-5 w-5 text-white" /></div>,
      });
      clearFile();
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {preview ? (
        <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border-2 border-dashed border-border flex items-center justify-center">
          <Image src={preview} alt="Image preview" layout="fill" objectFit="contain" />
           <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full" onClick={clearFile} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-full max-w-md flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            isDragging ? "border-primary bg-accent/20" : "border-border hover:border-primary/50"
          )}
        >
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-accent">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground/80">PNG, JPG, or WEBP (max. 4MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={onFileInputChange}
            disabled={isProcessing}
          />
        </div>
      )}
      <Button onClick={handleAnalyze} disabled={!file || isProcessing} className="w-full max-w-md" size="lg">
        {isProcessing ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isProcessing ? "Analyzing..." : "Analyze Image"}
      </Button>
    </div>
  );
}
