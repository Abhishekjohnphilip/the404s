
'use server';

import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getDataStore, updateDataStore, logDataChange } from './data-store';

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

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // Array of voter IDs/names
}

export interface Poll {
  id: string;
  slug: string;
  name: string;
  question: string;
  options: PollOption[];
  allowAnonymous: boolean;
  multipleChoice: boolean;
  createdAt: string;
  isActive: boolean;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  options?: string[]; // For select, radio fields
  placeholder?: string;
}

export interface FormSubmission {
  id: string;
  submitterName?: string; // Optional for anonymous submissions
  responses: { [fieldId: string]: string | string[] };
  submittedAt: string;
}

export interface Form {
  id: string;
  slug: string;
  name: string;
  description: string;
  fields: FormField[];
  submissions: FormSubmission[];
  allowAnonymous: boolean;
  createdAt: string;
  isActive: boolean;
}

export interface Event {
  slug: string;
  name: string;
  date: string;
  type: 'birthday' | 'event' | 'poll' | 'form';
  media: MediaItem[];
  wishes: Wish[];
  pollData?: Poll; // Only for poll type events
  formData?: Form; // Only for form type events
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

// --- Internal Data Access Functions ---

// Reads the entire database from the data store.
export async function readDb(): Promise<DbData> {
  const dataStore = await getDataStore();
  return {
    years: dataStore.years || [],
    admins: dataStore.admins || [],
    socialPosts: dataStore.socialPosts || [],
  };
}

// Updates the in-memory data store (Note: changes are not persisted on Vercel)
export async function writeDb(db: DbData): Promise<void> {
  await updateDataStore(db);
  await logDataChange('DATABASE_UPDATE', {
    yearsCount: db.years.length,
    adminsCount: db.admins.length,
    socialPostsCount: db.socialPosts.length,
  });
  
  // Log a warning about data persistence in hosted environments
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Data changes are stored in memory only and will be lost on redeployment. Consider using a database for persistent storage.');
  }
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
  type: 'birthday' | 'event' | 'poll' | 'form',
  pollData?: Omit<Poll, 'id' | 'slug' | 'createdAt'>,
  formData?: Omit<Form, 'id' | 'slug' | 'createdAt' | 'submissions'>
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

  // Add poll data if it's a poll type event
  if (type === 'poll' && pollData) {
    newEvent.pollData = {
      ...pollData,
      id: crypto.randomUUID(),
      slug,
      createdAt: new Date().toISOString(),
    };
  }

  // Add form data if it's a form type event
  if (type === 'form' && formData) {
    newEvent.formData = {
      ...formData,
      id: crypto.randomUUID(),
      slug,
      createdAt: new Date().toISOString(),
      submissions: [],
    };
  }

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

// --- Poll Management Functions ---

export async function votePoll(
  year: number,
  eventSlug: string,
  optionIds: string[],
  voterName?: string
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }

  const event = yearData.events.find(e => e.slug === eventSlug && e.type === 'poll');
  if (!event || !event.pollData) {
    return { success: false, message: 'Poll not found.' };
  }

  const poll = event.pollData;
  if (!poll.isActive) {
    return { success: false, message: 'Poll is not active.' };
  }

  const voterId = voterName || `anonymous_${crypto.randomUUID().slice(0, 8)}`;

  // Check if user already voted (if not anonymous)
  if (voterName) {
    const hasVoted = poll.options.some(option => option.voters.includes(voterId));
    if (hasVoted) {
      return { success: false, message: 'You have already voted in this poll.' };
    }
  }

  // Validate option IDs
  const validOptions = poll.options.filter(option => optionIds.includes(option.id));
  if (validOptions.length === 0) {
    return { success: false, message: 'Invalid poll options selected.' };
  }

  // Check multiple choice restriction
  if (!poll.multipleChoice && optionIds.length > 1) {
    return { success: false, message: 'This poll allows only one choice.' };
  }

  // Add votes
  validOptions.forEach(option => {
    option.votes += 1;
    option.voters.push(voterId);
  });

  await writeDb(db);
  return { success: true, message: 'Vote recorded successfully!' };
}

// --- Form Management Functions ---

export async function submitForm(
  year: number,
  eventSlug: string,
  responses: { [fieldId: string]: string | string[] },
  submitterName?: string
): Promise<{ success: boolean; message?: string }> {
  const db = await readDb();
  const yearData = db.years.find(y => y.year === year);
  if (!yearData) {
    return { success: false, message: 'Year not found.' };
  }

  const event = yearData.events.find(e => e.slug === eventSlug && e.type === 'form');
  if (!event || !event.formData) {
    return { success: false, message: 'Form not found.' };
  }

  const form = event.formData;
  if (!form.isActive) {
    return { success: false, message: 'Form is not accepting submissions.' };
  }

  // Validate required fields
  const missingFields = form.fields
    .filter(field => field.required && !responses[field.id])
    .map(field => field.label);

  if (missingFields.length > 0) {
    return { 
      success: false, 
      message: `Please fill in required fields: ${missingFields.join(', ')}` 
    };
  }

  // Create submission
  const submission: FormSubmission = {
    id: crypto.randomUUID(),
    submitterName,
    responses,
    submittedAt: new Date().toISOString(),
  };

  form.submissions.push(submission);
  await writeDb(db);
  return { success: true, message: 'Form submitted successfully!' };
}

export async function getPollResults(
  year: number,
  eventSlug: string
): Promise<Poll | null> {
  const event = await getEventBySlug(year, eventSlug);
  if (!event || event.type !== 'poll' || !event.pollData) {
    return null;
  }
  return event.pollData;
}

export async function getFormSubmissions(
  year: number,
  eventSlug: string
): Promise<FormSubmission[] | null> {
  const event = await getEventBySlug(year, eventSlug);
  if (!event || event.type !== 'form' || !event.formData) {
    return null;
  }
  return event.formData.submissions;
}

    