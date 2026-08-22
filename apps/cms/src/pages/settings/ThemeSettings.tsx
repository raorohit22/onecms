import { PageShell, PageShellHeader, PageShellTitle, PageShellDescription, PageShellContent } from '../../components/page-shell';

export function ThemeSettings() {
  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Theme Customization</PageShellTitle>
        <PageShellDescription>Adjust the visual branding and colors for the CMS and public site.</PageShellDescription>
      </PageShellHeader>
      <PageShellContent>
        <div className="p-8 border rounded-md border-dashed text-center text-muted-foreground">
          Theme builder interface coming soon...
        </div>
      </PageShellContent>
    </PageShell>
  );
}
