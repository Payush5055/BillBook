"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export async function uploadAsset(formData: FormData, bucket: "brand-assets") {
  const file = formData.get("file");
  const userId = formData.get("userId");

  if (!(file instanceof File) || typeof userId !== "string") {
    throw new Error("Invalid upload payload.");
  }

  const extension = file.name.split(".").pop() || "png";
  const filePath = `${userId}/${slugify(file.name.replace(`.${extension}`, ""))}-${Date.now()}.${extension}`;
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  revalidatePath("/setup");
  revalidatePath("/settings");
  return data.publicUrl;
}
