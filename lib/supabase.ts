import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SUPABASE_URL = "https://bvjgogntjsrzamskscbg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bIw2Mt_rhqPdJtOftTpd5w_jqDOlaLo";
const STORAGE_BUCKET = "avatars";

const authStorage = Platform.OS === "web" ? undefined : {
  async getItem(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

export type SupabaseProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
  xmpp_username?: string | null;
  xmpp_password?: string | null;
  xmpp_server?: string | null;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Upload avatar image to Supabase storage
 * @param userId User ID
 * @param base64Data Base64 encoded image data
 * @param filename File name (e.g., "avatar.jpg")
 * @returns Public URL of the uploaded image
 */
export async function uploadAvatar(userId: string, base64Data: string, filename: string = "avatar.jpg"): Promise<string | null> {
  try {
    const filePath = `${userId}/${filename}`;

    // Convert base64 to Uint8Array for React Native compatibility
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, bytes, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/jpeg",
      });

    if (error) {
      console.warn("[Supabase] Avatar upload error:", error);
      return null;
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl?.publicUrl ?? null;
  } catch (e) {
    console.warn("[Supabase] Avatar upload exception:", e);
    return null;
  }
}

/**
 * Update user profile in Supabase
 */
export async function updateProfile(userId: string, updates: Partial<SupabaseProfile>): Promise<boolean> {
  try {
    console.log('[Supabase] Updating profile for user:', userId, 'with updates:', updates);
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.warn("[Supabase] Profile update error:", error);
      return false;
    }
    console.log('[Supabase] Profile update successful');
    return true;
  } catch (e) {
    console.warn("[Supabase] Profile update exception:", e);
    return false;
  }
}
