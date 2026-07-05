
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { runClientOcr } from "@/lib/ocr";
import { UploadCloud, X, LoaderCircle, CheckCircle, Image as ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnalyzedImage } from "@/types";

type UploaderProps = {
  onDataExtracted: (data: AnalyzedImage[]) => void;
  isProcessing: boolean;
  setProcessing: (isProcessing: boolean) => void;
};

type FilePreview = {
  file: File;
  previewUrl: string;
};

export function Uploader({ onDataExtracted, isProcessing, setProcessing }: UploaderProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [refNumber, setRefNumber] = useState("A");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFilesChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFilePreviews: FilePreview[] = [];
      const currentFileCount = files.length;
      if (currentFileCount + selectedFiles.length > 6) {
        toast({
          variant: "destructive",
          title: "Too many files",
          description: "You can upload a maximum of 6 images.",
        });
        return;
      }

      Array.from(selectedFiles).forEach(file => {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
          toast({
            variant: "destructive",
            title: "File too large",
            description: `${file.name} is larger than 4MB.`,
          });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          newFilePreviews.push({ file, previewUrl: reader.result as string });
          // Check if all files have been read
          if (newFilePreviews.length === selectedFiles.length) {
            setFiles(prev => [...prev, ...newFilePreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesChange(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
     if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const clearAllFiles = () => {
    setFiles([]);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    
    try {
      const results: (AnalyzedImage | null)[] = await Promise.all(
        files.map(async (filePreview) => {
          const { parsed } = await runClientOcr(filePreview.previewUrl);
          if (parsed.score === 0) {
            toast({
              variant: "destructive",
              title: `Couldn't read ${filePreview.file.name}`,
              description: "No readings detected — try a clearer photo or use Manual Entry.",
            });
            return null; // Nothing usable extracted
          }
          // Map parsed fields onto a reading. Position isn't on the display (it's on a paper/case),
          // so it defaults to Unknown for the user to set in Review. liftAngle defaults to 52.
          return {
            imageUrl: filePreview.previewUrl,
            data: {
              rate: parsed.rate,
              amplitude: parsed.amplitude,
              beatError: parsed.beatError,
              position: "Unknown",
              liftAngle: parsed.liftAngle || "52",
              customerName: customerName || "",
              refNumber: refNumber || "",
            },
          };
        })
      );
      
      const successfulResults = results.filter((res): res is AnalyzedImage => res !== null);

      if (successfulResults.length > 0) {
        onDataExtracted(successfulResults);
        toast({
          title: "Analysis Complete",
          description: `${successfulResults.length} of ${files.length} images analyzed successfully.`,
          action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="h-5 w-5 text-white" /></div>,
        });
        clearAllFiles();
        setCustomerName("");
        setRefNumber("A");
      } else {
         toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "Could not extract data from any of the images.",
        });
      }

    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : "An unknown error occurred during batch analysis.";
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
    if (e.dataTransfer.files) {
      handleFilesChange(e.dataTransfer.files);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
        <div>
          <Label htmlFor="customerName">Customer Name (Optional)</Label>
          <Input 
            id="customerName" 
            placeholder="John Doe" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={isProcessing}
          />
        </div>
        <div>
          <Label htmlFor="refNumber">Ref. Number (Optional)</Label>
          <Input 
            id="refNumber" 
            placeholder="A123" 
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
            disabled={isProcessing}
          />
        </div>
      </div>
      
      {files.length > 0 ? (
        <div className="w-full max-w-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {files.map((file, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                <Image src={file.previewUrl} alt={`Preview ${index + 1}`} layout="fill" objectFit="cover" />
                <Button variant="destructive" size="icon" className="absolute top-1 right-1 z-10 h-6 w-6 rounded-full" onClick={() => removeFile(index)} disabled={isProcessing}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
             {files.length < 6 && (
              <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className="flex items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={cn(
            "w-full max-w-lg flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            isDragging ? "border-primary bg-accent/20" : "border-border hover:border-primary/50"
          )}
        >
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-accent">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground/80">Up to 6 images (PNG, JPG, WEBP)</p>
        </div>
      )}
       <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={onFileInputChange}
          disabled={isProcessing || files.length >= 6}
          multiple
        />

      <div className="flex gap-2 w-full max-w-lg">
        {files.length > 0 && (
          <Button variant="outline" onClick={clearAllFiles} disabled={isProcessing}>
            <Trash2 className="mr-2" /> Clear
          </Button>
        )}
        <Button onClick={handleAnalyze} disabled={files.length === 0 || isProcessing} className="w-full" size="lg">
          {isProcessing ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isProcessing ? `Analyzing ${files.length} images...` : `Analyze ${files.length} Image${files.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}

    