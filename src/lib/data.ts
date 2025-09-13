
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface Wish {
  id: string;
  author: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
  isAppropriate: boolean;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  hint: string;
}

export interface Event {
  slug: string;
  name: string;
  date: string;
  type: 'birthday' | 'event';
  media: MediaItem[];
  wishes: Wish[];
}

export interface YearData {
  year: number;
  events: Event[];
}

export interface AdminUser {
  username: string;
  password?: string; // Password should not be sent to client
}

export interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok';
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  createdAt: string;
  isActive: boolean;
}

interface DbData {
  years: YearData[];
  admins: AdminUser[];
  socialPosts: SocialPost[];
}

// Path to the JSON file that acts as the database
const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

// --- Internal Data Access Functions ---

// Reads the entire database from the JSON file.
export async function readDb(): Promise<DbData> {
  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    const data = JSON.parse(fileContent);
    return {
      years: data.years || [],
      admins: data.admins || [],
      socialPosts: data.socialPosts || [],
    };
  } catch (error) {
    // If the file doesn't exist or is empty, return an initial structure.
    return { years: [], admins: [], socialPosts: [] };
  }
}

// Writes the entire database to the JSON file.
export async function writeDb(db: DbData): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

// --- Public Data Access Functions ---

export async function getYears(): Promise<number[]> {
  const { years } = await readDb();
  return years.map(y => y.year).sort((a, b) => b - a);
}

export async function getEventsByYear(
  year: number
): Promise<Omit<Event, 'media' | 'wishes'>[]> {
  const { years } = await readDb();
  const yearData = years.find(y => y.year === year);
  return yearData
    ? yearData.events.map(({ media, wishes, ...rest }) => rest)
    : [];
}

export async function getEventBySlug(
  year: number,
  slug: string
): Promise<Event | null> {
  const { years } = await readDb();
  const yearData = years.find(y => y.year === year);
  if (!yearData) return null;
  const event = yearData.events.find(p => p.slug === slug);
  if (!event) return null;

  // Handle different URL formats: cloud URLs, local uploads, data URIs, and placeholder images
  const populatedMedia =
    event.media
      .map(mediaItem => {
        // Cloud storage URLs (S3, Cloudinary, etc.)
        if (mediaItem.url.startsWith('http://') || mediaItem.url.startsWith('https://')) {
          return mediaItem;
        }
        // Local uploads and data URIs
        if (mediaItem.url.startsWith('data:') || mediaItem.url.startsWith('/uploads/')) {
          return mediaItem;
        }
        // Placeholder images
        const placeholder = PlaceHolderImages.find(p => p.id === mediaItem.id);
        return {
          ...mediaItem,
          url: placeholder?.imageUrl || '',
          hint: placeholder?.imageHint || '',
        };
      })
      .filter(item => item.url) || [];

  return { ...event, media: populatedMedia, wishes: [...event.wishes].reverse() };
}

// --- Data Mutation Functions ---

export async function addYear(
  year: number
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  if (db.years.some(y => y.year === year)) {
    return { success: false, message: 'Year already exists.' };
  }
  db.years.push({ year, events: [] });
  db.years.sort((a, b) => a.year - b.year);
  await writeDb(db);
  return { success: true };
}

export async function addEvent(
  year: number,
  name: string,
  date: string,
  type: 'birthday' | 'event'
): Promise<{ success: boolean; message?: string; newSlug?: string }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  if (yearData.events.some(e => e.slug === slug)) {
    return {
      success: false,
      message:
        'An event with this name already exists for this year. Please choose a different name.',
    };
  }

  const newEvent: Event = {
    slug,
    name,
    date,
    type,
    media: [],
    wishes: [],
  };

  yearData.events.push(newEvent);
  await writeDb(db);
  return { success: true, newSlug: slug };
}

export async function addWishToEvent(
  year: number,
  eventSlug: string,
  wish: Omit<Wish, 'isAppropriate'>
): Promise<{ success: boolean; message?: string; newWish?: Wish }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }
  const event = yearData.events.find(e => e.slug === eventSlug);
  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  const newWish: Wish = { ...wish, isAppropriate: true };
  event.wishes.push(newWish);
  await writeDb(db);

  return { success: true, newWish };
}

export async function deleteWishFromEvent(
  year: number,
  eventSlug: string,
  wishId: string
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }
  const event = yearData.events.find(e => e.slug === eventSlug);
  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  const initialLength = event.wishes.length;
  event.wishes = event.wishes.filter(w => w.id !== wishId);

  if (event.wishes.length === initialLength) {
    return { success: false, message: 'Wish not found.' };
  }

  await writeDb(db);
  return { success: true };
}

export async function deleteEvent(
  year: number,
  eventSlug: string
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }

  const initialLength = yearData.events.length;
  yearData.events = yearData.events.filter(e => e.slug !== eventSlug);

  if (yearData.events.length === initialLength) {
    return { success: false, message: 'Event not found.' };
  }

  await writeDb(db);
  return { success: true };
}

export async function dbDeleteYear(
  yearToDelete: number
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  const initialLength = db.years.length;
  db.years = db.years.filter(y => y.year !== yearToDelete);

  if (db.years.length === initialLength) {
    return { success: false, message: `Year ${yearToDelete} not found.` };
  }

  await writeDb(db);
  return { success: true, message: `Year ${yearToDelete} deleted successfully.` };
}

export async function updateEvent(
  year: number,
  originalSlug: string,
  updatedName: string,
  updatedDate: string,
  updatedType: 'birthday' | 'event'
): Promise<{ success: boolean; message?: string; updatedSlug?: string }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }

  const eventIndex = yearData.events.findIndex(e => e.slug === originalSlug);
  if (eventIndex === -1) {
    return { success: false, message: 'Event not found.' };
  }

  const newSlug = updatedName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Check if a different event with the new slug already exists
  if (
    yearData.events.some(e => e.slug === newSlug && e.slug !== originalSlug)
  ) {
    return {
      success: false,
      message:
        'Another event with this name already exists. Please choose a different name.',
    };
  }

  // Update the event
  yearData.events[eventIndex] = {
    ...yearData.events[eventIndex],
    slug: newSlug,
    name: updatedName,
    date: updatedDate,
    type: updatedType,
  };

  await writeDb(db);
  return { success: true, message: 'Event updated!', updatedSlug: newSlug };
}

export async function addMediaToEvent(
  year: number,
  eventSlug: string,
  newMediaItems: MediaItem[],
  existingMediaIds: string[]
): Promise<{ success: boolean; message: string }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }

  const event = yearData.events.find(e => e.slug === eventSlug);
  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  // Filter the current media to only keep the ones that are in existingMediaIds
  const updatedExistingMedia = event.media.filter(m =>
    existingMediaIds.includes(m.id)
  );

  // Combine the kept existing media with the new media items
  event.media = [...updatedExistingMedia, ...newMediaItems];

  await writeDb(db);
  return { success: true, message: 'Media updated successfully.' };
}

// --- Admin Management Functions ---

export async function getAdmins(): Promise<Omit<AdminUser, 'password'>[]> {
  const { admins } = await readDb();
  // Never send passwords to the client
  return admins.map(({ username }) => ({ username }));
}

export async function getAdminsWithPasswords(): Promise<AdminUser[]> {
    const { admins } = await readDb();
    return admins;
}

export async function addAdmin(
  username: string,
  password?: string
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  if (db.admins.some(a => a.username === username)) {
    return { success: false, message: 'Admin username already exists.' };
  }
  db.admins.push({ username, password });
  await writeDb(db);
  return { success: true };
}

export async function deleteAdmin(
  username: string
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  const initialLength = db.admins.length;
  db.admins = db.admins.filter(a => a.username !== username);
  if (db.admins.length === initialLength) {
    return { success: false, message: 'Admin not found.' };
  }
  await writeDb(db);
  return { success: true };
}

// --- Social Posts Management Functions ---

export async function getSocialPosts(): Promise<SocialPost[]> {
  const { socialPosts } = await readDb();
  return socialPosts.filter(post => post.isActive).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addSocialPost(
  platform: SocialPost['platform'],
  title: string,
  description: string,
  url: string,
  imageUrl?: string
): Promise<{ success: boolean; message?: string; newPost?: SocialPost }> {
  const db = await readDb();
  
  const newPost: SocialPost = {
    id: crypto.randomUUID(),
    platform,
    title,
    description,
    url,
    imageUrl,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  
  db.socialPosts.push(newPost);
  await writeDb(db);
  return { success: true, newPost };
}

export async function deleteSocialPost(
  postId: string
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  const initialLength = db.socialPosts.length;
  db.socialPosts = db.socialPosts.filter(p => p.id !== postId);
  
  if (db.socialPosts.length === initialLength) {
    return { success: false, message: 'Post not found.' };
  }
  
  await writeDb(db);
  return { success: true };
}

    