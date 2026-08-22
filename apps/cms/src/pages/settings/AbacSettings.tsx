import { PageShell, PageShellHeader, PageShellTitle, PageShellDescription, PageShellContent } from '../../components/page-shell';

export function AbacSettings() {
  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Attribute-Based Access Control (ABAC)</PageShellTitle>
        <PageShellDescription>Define fine-grained dynamic attribute rules for resource access.</PageShellDescription>
      </PageShellHeader>
      <PageShellContent>
        <div className="p-8 border rounded-md border-dashed text-center text-muted-foreground">
          ABAC Rule Builder coming soon...
        </div>
      </PageShellContent>
    </PageShell>
  );
}
