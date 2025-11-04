
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TimegrapherReadingData, POSITIONS } from "@/types";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  position: z.enum(POSITIONS),
  rate: z.string().min(1, "Rate is required."),
  amplitude: z.string().min(1, "Amplitude is required."),
  beatError: z.string().min(1, "Beat error is required."),
  liftAngle: z.string().min(1, "Lift angle is required."),
  // customerName and refNumber are no longer required here
  customerName: z.string().optional(),
  refNumber: z.string().optional(),
});

type ManualEntryFormProps = {
  onDataAdded: (data: Omit<TimegrapherReadingData, 'customerName' | 'refNumber'> & { customerName?: string, refNumber?: string }) => void;
};

export function ManualEntryForm({ onDataAdded }: ManualEntryFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: "Dial Up",
      rate: "",
      amplitude: "",
      beatError: "",
      liftAngle: "52",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onDataAdded(values);
    toast({
      title: "Reading Added",
      description: "The manual entry has been recorded.",
    });
    // Reset fields for the next entry, but keep customer/ref info if it exists
    form.reset({
      ...form.getValues(),
      position: "Dial Up",
      rate: "",
      amplitude: "",
      beatError: "",
    });
  }

  return (
    <div className="flex justify-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-lg space-y-6">
           <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {POSITIONS.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate (s/d)</FormLabel>
                  <FormControl>
                    <Input placeholder="+5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amplitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amplitude (°)</FormLabel>
                  <FormControl>
                    <Input placeholder="290" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="beatError"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beat Error (ms)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="liftAngle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lift Angle (°)</FormLabel>
                  <FormControl>
                    <Input placeholder="52" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Reading
          </Button>
        </form>
      </Form>
    </div>
  );
}
