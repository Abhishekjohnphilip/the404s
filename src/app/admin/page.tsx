
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PlusCircle, Loader2, AlertCircle, Trash2, Pencil, UserPlus, ShieldCheck, LogOut, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useActionState, useEffect, useState, useTransition, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addYear, addEvent, deleteEvent, deleteYear, updateEvent, addAdmin, deleteAdmin } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getYears, getEventsByYear, getAdmins as dbGetAdmins, type Event, type AdminUser } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

const initialYearState = { success: false, message: '' };
const initialEventState = { success: false, message: '', newSlug: undefined, updatedSlug: undefined };
const initialAdminState = { success: false, message: '' };

function SubmitButton({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

function AddYearDialog({ onYearAdded }: { onYearAdded: () => void }) {
  const [state, formAction, isPending] = useActionState(addYear, initialYearState);
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      onYearAdded();
      formRef.current?.reset();
    }
  }, [state, isPending, onYearAdded]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Year
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} ref={formRef}>
          <DialogHeader>
            <DialogTitle>Add a New Year</DialogTitle>
            <DialogDescription>
              Create a new year to start adding birthdays and events.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {state.message && !state.success && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              name="year"
              type="number"
              placeholder={new Date().getFullYear().toString()}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Year
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EventDialogProps = {
  year: number;
  onSuccess: () => void;
  event?: Omit<Event, 'media' | 'wishes'>;
};

function EventDialog({ year, onSuccess, event }: EventDialogProps) {
  const isEditMode = !!event;
  const action = isEditMode ? updateEvent : addEvent;
  const [state, formAction, isPending] = useActionState(action, initialEventState);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      onSuccess();
      formRef.current?.reset();
      if (state.newSlug) {
        const eventType = (formRef.current?.['type' as any] as HTMLSelectElement)?.value || 'birthday';
        router.push(`/${year}/${eventType}/${state.newSlug}?admin=true`);
      }
    }
  }, [state, isPending, onSuccess, router, year]);
  
  const title = isEditMode ? `Edit ${event.name}` : `Add New Event to ${year}`;
  const description = isEditMode ? "Update the details for this event." : "Add a new birthday or event for this year.";
  const buttonText = isEditMode ? "Save Changes" : "Add Event";
  const buttonIcon = isEditMode ? <Pencil className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} ref={formRef}>
          <input type="hidden" name="year" value={year} />
          {isEditMode && <input type="hidden" name="originalSlug" value={event.slug} />}
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {state.message && !state.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select name="type" defaultValue={event?.type || "birthday"}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="event">General Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={event?.name}
                placeholder="e.g., Jane Doe or Company Picnic"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                defaultValue={event?.date}
                placeholder="e.g., April 15"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton>{buttonIcon}{buttonText}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function DeleteButton({
  year,
  slug,
  onDeleted,
  isYear,
}: {
  year: number;
  slug?: string;
  onDeleted: () => void;
  isYear?: boolean;
}) {
  const formAction = async (formData: FormData) => {
    if (isYear) {
      await deleteYear(formData);
    } else {
      await deleteEvent(formData);
    }
    onDeleted();
  };

  const title = isYear ? "Delete Year" : "Delete Event";
  const description = isYear
    ? "This will permanently delete the entire year, including all its events and wishes. This action cannot be undone."
    : "This will permanently delete the event and all its wishes. This action cannot be undone.";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={isYear ? "sm" : "icon"}>
          <Trash2 className="h-4 w-4" />
          {isYear && <span className="ml-2">Delete Year</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction}>
          <input type="hidden" name="year" value={year} />
          {!isYear && <input type="hidden" name="eventSlug" value={slug} />}
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <SubmitButton variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddAdminDialog({ onAdminAdded }: { onAdminAdded: () => void }) {
  const [state, formAction, isPending] = useActionState(addAdmin, initialAdminState);
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      onAdminAdded();
      formRef.current?.reset();
    }
  }, [state, isPending, onAdminAdded]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} ref={formRef}>
          <DialogHeader>
            <DialogTitle>Add a New Admin</DialogTitle>
            <DialogDescription>
              Create a new administrator account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {state.message && !state.success && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="off"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Admin
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAdminButton({ username, onDeleted }: { username: string; onDeleted: () => void; }) {
  const formAction = async (formData: FormData) => {
    await deleteAdmin(formData);
    onDeleted();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction}>
          <input type="hidden" name="username" value={username} />
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {username}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the admin account.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <SubmitButton variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Admin
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AdminManager({ onAdminDataChanged, currentUser }: { onAdminDataChanged: () => void, currentUser: string | null }) {
  const [admins, setAdmins] = useState<Omit<AdminUser, 'password'>[]>([]);

  const fetchAdmins = async () => {
    const adminData = await dbGetAdmins();
    setAdmins(adminData);
  };

  useEffect(() => {
    fetchAdmins();
  }, [onAdminDataChanged]);

  const handleAdminAdded = () => {
    fetchAdmins();
    onAdminDataChanged();
  }
  
  if (currentUser !== 'abhi') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center bg-muted/30">
        <div>
          <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2">
            <ShieldCheck /> Admin Management
          </CardTitle>
          <CardDescription>Add or remove administrators.</CardDescription>
        </div>
        <AddAdminDialog onAdminAdded={handleAdminAdded} />
      </CardHeader>
      <CardContent className="p-4">
        <ul className="divide-y divide-border">
          {admins.map(admin => (
            <li
              key={admin.username}
              className="flex justify-between items-center py-3"
            >
              <span className="font-medium">{admin.username}</span>
              {admin.username !== 'abhi' && (
                <DeleteAdminButton username={admin.username} onDeleted={handleAdminAdded} />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}


type AdminDashboardData = {
  years: AdminYearData[];
  admins: AdminUser[];
};

type AdminYearData = {
  year: number;
  events: Omit<Event, 'media' | 'wishes'>[];
};

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData>({ years: [], admins: [] });
  const [isPending, startTransition] = useTransition();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = sessionStorage.getItem('admin_user');
    if (!user) {
      router.push('/admin/login');
    } else {
      setCurrentUser(user);
    }
  }, [router]);

  const fetchData = () => {
    startTransition(async () => {
      const years = await getYears();
      const allYearData = await Promise.all(
        years.map(async year => {
          const events = await getEventsByYear(year);
          return { year, events };
        })
      );

      const admins = await dbGetAdmins();

      setData({
        years: allYearData.sort((a,b) => b.year - a.year),
        admins,
      });
    });
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_user');
    router.push('/admin/login');
  };
  
  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-headline font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">Logged in as: <strong>{currentUser}</strong></p>
        </div>
        <div className="flex items-center gap-2">
            <AddYearDialog onYearAdded={fetchData} />
            <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2"/>Logout</Button>
        </div>
      </div>

      <div className="space-y-8">
        <AdminManager onAdminDataChanged={fetchData} currentUser={currentUser} />

        {isPending && data.years.length === 0 && <p>Loading...</p>}
        {data.years.map(({ year, events }) => (
          <Card key={year}>
            <CardHeader className="flex flex-row justify-between items-center bg-muted/30">
              <div className="flex-grow">
                <CardTitle className="text-2xl font-bold font-headline">
                  {year}
                </CardTitle>
                <CardDescription>Manage events for {year}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <EventDialog year={year} onSuccess={fetchData} />
                <DeleteButton year={year} onDeleted={fetchData} isYear />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {events.length > 0 ? (
                <ul className="divide-y divide-border">
                  {events.map(event => {
                    const linkHref = `/${year}/${event.type}/${event.slug}?admin=true`;
                    return (
                        <li
                        key={event.slug}
                        className="flex justify-between items-center py-3"
                        >
                        <div className="flex-grow">
                            <Link
                            href={linkHref}
                            className="font-medium hover:underline"
                            >
                            {event.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">{event.date} - <span className="capitalize">{event.type}</span></p>
                        </div>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={linkHref}>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <EventDialog year={year} onSuccess={fetchData} event={event} />
                            <DeleteButton year={year} slug={event.slug} onDeleted={fetchData} />
                        </div>
                        </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  No events added for this year yet.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

    
