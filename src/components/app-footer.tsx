export default function AppFooter() {
  return (
    <footer className="border-t mt-12 bg-card">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} THE404s. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
