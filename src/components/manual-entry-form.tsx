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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { TimegrapherReading } from "@/types";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  refNumber: z.string().min(1, "Reference number is required."),
  rate: z.string().min(1, "Rate is required."),
  amplitude: z.string().min(1, "Amplitude is required."),
  beatError: z.string().min(1, "Beat error is required."),
});

type ManualEntryFormProps = {
  onDataAdded: (data: Omit<TimegrapherReading, "id" | "timestamp">) => void;
};

export function ManualEntryForm({ onDataAdded }: ManualEntryFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      refNumber: "A",
      rate: "",
      amplitude: "",
      beatError: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onDataAdded(values);
    toast({
      title: "Reading Added",
      description: "The manual entry has been recorded.",
    });
    form.reset();
  }

  return (
    <div className="flex justify-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-lg space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="refNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ref. Number</FormLabel>
                  <FormControl>
                    <Input placeholder="A123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
