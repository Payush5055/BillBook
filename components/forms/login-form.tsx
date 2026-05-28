"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/lib/actions";
import { authSchema } from "@/lib/validations";
import type { z } from "zod";

type FormValues = z.infer<typeof authSchema>;

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await signInAction(values);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to sign in.");
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <FormField label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" placeholder="owner@business.com" {...form.register("email")} />
      </FormField>
      <FormField label="Password" error={form.formState.errors.password?.message}>
        <Input type="password" placeholder="Minimum 8 characters" {...form.register("password")} />
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
