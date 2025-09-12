
'use server';

import { z } from 'zod';
import { moderateWish } from '@/ai/flows/moderate-wishes';
import { generateImageHint } from '@/ai/flows/generate-image-hint';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import {
  addYear as dbAddYear,
  addEvent as dbAddEvent,
  addWishToEvent,
  deleteWishFromEvent,
  deleteEvent as dbDeleteEvent,
  dbDeleteYear,
  updateEvent as dbUpdateEvent,
  addMediaToEvent as dbAddMediaToEvent,
  getAdminsWithPasswords,
  addAdmin as dbAddAdmin,
  deleteAdmin as dbDeleteAdmin,
  getAdmins,
  addSocialPost as dbAddSocialPost,
  deleteSocialPost as dbDeleteSocialPost,
} from '@/lib/data';
import { redirect } from 'next/navigation';
import type { Wish, MediaItem } from '@/lib/data';

const wishSchema = z.object({
  author: z.string().min(1, 'Name is required').max(50),
  message: z.string().min(1, 'Message is required').max(500),
  personSlug: z.string(),
  year: z.string(),
  image: z.any().optional(), // File object
});

export type WishFormState = {
  success: boolean;
  message: string;
  newWish?: Wish;
};

export async function submitWish(
  prevState: WishFormState,
  formData: FormData
): Promise<WishFormState> {
  const rawAuthor = formData.get('author');
  const finalAuthor =
    rawAuthor && String(rawAuthor).trim() !== ''
      ? String(rawAuthor)
      : 'Anonymous';

  const imageFile = formData.get('image') as File | null;

  const validatedFields = wishSchema.safeParse({
    author: finalAuthor,
    message: formData.get('message'),
    personSlug: formData.get('personSlug'),
    year: formData.get('year'),
    image: imageFile,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data. Please check your inputs.',
    };
  }

  const { message, personSlug, year } = validatedFields.data;

  try {
    const moderationResult = await moderateWish({ text: message });

    if (!moderationResult.isAppropriate) {
      return {
        success: false,
        message: `Your message was flagged as inappropriate. Reason: ${
          moderationResult.reason || 'Content policy violation'
        }. Please revise.`,
      };
    }

    let imageUrl: string | undefined;

    // Handle image upload if present
    if (imageFile && imageFile.size > 0) {
      try {
        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        const fileId = crypto.randomUUID();
        const fileExtension = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${fileId}.${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Save file to disk
        const bytes = await imageFile.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
        
        imageUrl = `/uploads/${fileName}`;
      } catch (error) {
        console.error('Error saving image:', error);
        return {
          success: false,
          message: 'Failed to upload image. Please try again.',
        };
      }
    }

    const wishData = {
      id: crypto.randomUUID(),
      author: finalAuthor,
      message,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    const result = await addWishToEvent(
      parseInt(year, 10),
      personSlug,
      wishData
    );

    if (!result.success || !result.newWish) {
      return { success: false, message: result.message || 'Failed to save wish.' };
    }

    revalidatePath(`/${year}/birthday/${personSlug}`);

    return {
      success: true,
      message: 'Your wish has been posted!',
      newWish: result.newWish,
    };
  } catch (error) {
    console.error('Error submitting wish:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}

export async function deleteWish(formData: FormData) {
  const wishId = formData.get('wishId') as string;
  const personSlug = formData.get('personSlug') as string;
  const year = formData.get('year') as string;

  if (!wishId || !personSlug || !year) {
    return { success: false, message: 'Missing required fields.' };
  }

  const result = await deleteWishFromEvent(
    parseInt(year, 10),
    personSlug,
    wishId
  );

  if (result.success) {
    revalidatePath(`/${year}/birthday/${personSlug}`);
  }

  return result;
}

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Both username and password are required.',
    };
  }

  const { username, password } = validatedFields.data;
  const admins = await getAdminsWithPasswords();
  const admin = admins.find(
    (a) => a.username === username && a.password === password
  );

  if (admin) {
    return {
      success: true,
      message: 'Login successful!',
      username: admin.username,
    };
  } else {
    return {
      success: false,
      message: 'Invalid username or password.',
    };
  }
}

const addYearSchema = z.object({
  year: z.coerce.number().int().min(1900, 'Year must be a valid year.'),
});

export async function addYear(prevState: any, formData: FormData) {
  const validatedFields = addYearSchema.safeParse({
    year: formData.get('year'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors[0].message,
    };
  }

  const { year } = validatedFields.data;
  const result = await dbAddYear(year);

  if (result.success) {
    revalidatePath('/admin');
    return { success: true, message: `Year ${year} added successfully.` };
  } else {
    return { success: false, message: result.message };
  }
}

const addEventSchema = z.object({
  year: z.coerce.number(),
  name: z.string().min(1, 'Name is required.'),
  date: z.string().min(1, 'Date is required.'),
  type: z.enum(['birthday', 'event']),
});

export type EventFormState = {
  success: boolean;
  message: string;
  newSlug?: string;
  updatedSlug?: string;
};

export async function addEvent(
  prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const validatedFields = addEventSchema.safeParse({
    year: formData.get('year'),
    name: formData.get('name'),
    date: formData.get('date'),
    type: formData.get('type'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors[0].message,
    };
  }

  const { year, name, date, type } = validatedFields.data;
  const result = await dbAddEvent(year, name, date, type);

  if (result.success && result.newSlug) {
    revalidatePath(`/admin`);
    revalidatePath(`/${year}`);
    return { success: true, message: 'Event added!', newSlug: result.newSlug };
  } else {
    return { success: false, message: result.message || 'Failed to add event.' };
  }
}

const updateEventSchema = z.object({
  year: z.coerce.number(),
  originalSlug: z.string().min(1),
  name: z.string().min(1, 'Name is required.'),
  date: z.string().min(1, 'Date is required.'),
  type: z.enum(['birthday', 'event']),
});

export async function updateEvent(
  prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const validatedFields = updateEventSchema.safeParse({
    year: formData.get('year'),
    originalSlug: formData.get('originalSlug'),
    name: formData.get('name'),
    date: formData.get('date'),
    type: formData.get('type'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors[0].message,
    };
  }

  const { year, originalSlug, name, date, type } = validatedFields.data;
  const result = await dbUpdateEvent(year, originalSlug, name, date, type);

  if (result.success) {
    revalidatePath('/admin');
    revalidatePath(`/${year}`);
    revalidatePath(`/${year}/birthday/${originalSlug}`);
    if (result.updatedSlug && result.updatedSlug !== originalSlug) {
      revalidatePath(`/${year}/birthday/${result.updatedSlug}`);
    }
    return {
      success: true,
      message: 'Event updated!',
      updatedSlug: result.updatedSlug,
    };
  } else {
    return {
      success: false,
      message: result.message || 'Failed to update event.',
    };
  }
}

const deleteEventSchema = z.object({
  year: z.coerce.number(),
  eventSlug: z.string().min(1),
});

export async function deleteEvent(formData: FormData) {
  const validatedFields = deleteEventSchema.safeParse({
    year: formData.get('year'),
    eventSlug: formData.get('eventSlug'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid data for deleting event.',
    };
  }

  const { year, eventSlug } = validatedFields.data;
  const result = await dbDeleteEvent(year, eventSlug);

  if (result.success) {
    revalidatePath('/admin');
    revalidatePath(`/${year}`);
  }

  return result;
}

const deleteYearSchema = z.object({
  year: z.coerce.number(),
});

export async function deleteYear(formData: FormData) {
  const validatedFields = deleteYearSchema.safeParse({
    year: formData.get('year'),
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid year provided.' };
  }

  const { year } = validatedFields.data;
  const result = await dbDeleteYear(year);

  if (result.success) {
    revalidatePath('/admin');
  }

  return result;
}

const addMediaSchema = z.object({
  year: z.coerce.number(),
  eventSlug: z.string().min(1),
  media: z.array(z.any()), // File objects from FormData
  mediaTypes: z.array(z.enum(['image', 'video'])),
  existingMediaIds: z.array(z.string()),
});

export async function addMediaToEvent(
  prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const mediaFiles = formData.getAll('media[]') as File[];
  const mediaTypes = formData
    .getAll('mediaTypes[]')
    .map(String) as ('image' | 'video')[];
  const existingMediaIds = formData.getAll('existingMediaIds[]').map(String);

  const validatedFields = addMediaSchema.safeParse({
    year: formData.get('year'),
    eventSlug: formData.get('eventSlug'),
    media: mediaFiles,
    mediaTypes: mediaTypes,
    existingMediaIds: existingMediaIds,
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error);
    return { success: false, message: 'Invalid data.' };
  }

  const { year, eventSlug, media } = validatedFields.data;

  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const newMediaItems: MediaItem[] = await Promise.all(
      media.map(async (file, index) => {
        const type = mediaTypes[index];
        const fileId = crypto.randomUUID();
        const fileExtension = file.name.split('.').pop() || (type === 'image' ? 'jpg' : 'mp4');
        const fileName = `${fileId}.${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Save file to disk
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
        
        // Generate hint for images
        let hint = 'media';
        if (type === 'image') {
          const dataUri = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
          const hintResult = await generateImageHint({ photoDataUri: dataUri });
          hint = hintResult.hint || 'image';
        } else {
          hint = 'video';
        }

        return {
          id: fileId,
          type: type,
          url: `/uploads/${fileName}`,
          hint: hint,
        };
      })
    );

    const result = await dbAddMediaToEvent(
      year,
      eventSlug,
      newMediaItems,
      existingMediaIds
    );

    if (result.success) {
      revalidatePath(`/${year}/birthday/${eventSlug}`);
      revalidatePath(`/${year}/event/${eventSlug}`);
    }

    return result;
  } catch (error) {
    console.error('Error adding media:', error);
    return {
      success: false,
      message: 'An error occurred while processing media.',
    };
  }
}

const addAdminSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function addAdmin(prevState: any, formData: FormData) {
  const validatedFields = addAdminSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors[0].message,
    };
  }

  const { username, password } = validatedFields.data;
  const result = await dbAddAdmin(username, password);

  if (result.success) {
    revalidatePath('/admin');
    return { success: true, message: `Admin ${username} added.` };
  }
  return result;
}

const deleteAdminSchema = z.object({
  username: z.string().min(1),
});

export async function deleteAdmin(formData: FormData) {
  const validatedFields = deleteAdminSchema.safeParse({
    username: formData.get('username'),
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid username.' };
  }
  const { username } = validatedFields.data;
  const result = await dbDeleteAdmin(username);
  if (result.success) {
    revalidatePath('/admin');
  }
  return result;
}

// --- Social Posts Actions ---

const addSocialPostSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'twitter', 'youtube', 'tiktok']),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  url: z.string().url('Valid URL is required'),
  imageUrl: z.string().url().optional(),
});

export async function addSocialPost(
  prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const validatedFields = addSocialPostSchema.safeParse({
    platform: formData.get('platform'),
    title: formData.get('title'),
    description: formData.get('description'),
    url: formData.get('url'),
    imageUrl: formData.get('imageUrl') || undefined,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data. Please check your inputs.',
    };
  }

  const { platform, title, description, url, imageUrl } = validatedFields.data;

  try {
    const result = await dbAddSocialPost(platform, title, description, url, imageUrl);

    if (result.success) {
      revalidatePath('/');
      revalidatePath('/admin');
    }

    return {
      success: result.success,
      message: result.success ? 'Social post added successfully!' : result.message || 'Failed to add post.',
    };
  } catch (error) {
    console.error('Error adding social post:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}

export async function deleteSocialPost(formData: FormData) {
  const postId = formData.get('postId') as string;

  if (!postId) {
    return { success: false, message: 'Post ID is required.' };
  }

  try {
    const result = await dbDeleteSocialPost(postId);

    if (result.success) {
      revalidatePath('/');
      revalidatePath('/admin');
    }

    return result;
  } catch (error) {
    console.error('Error deleting social post:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}