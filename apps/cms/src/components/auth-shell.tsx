import React from 'react';
import { Link } from 'react-router-dom';
import { AuthShader } from './auth-shader';

export function AuthShell({ children }: { children: React.ReactNode }) {
	return (
		<main className="dark grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
			<section className="relative hidden min-h-svh overflow-hidden bg-muted p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
				<AuthShader />

				<div className="relative flex gap-2 text-sm/5">
					<Link to="/" aria-label="Homepage" className="flex items-center font-bold text-xl">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs mr-2">1</div>
            OneCMS
					</Link>
				</div>

				<div className="relative flex max-w-lg flex-col gap-8">
					<div className="flex flex-col gap-4">
						<p className="font-mono text-xs/4 text-muted-foreground uppercase">
							ONECMS
						</p>
						<h1 className="max-w-[14ch] text-5xl/14 font-semibold text-balance">
							Every content, one place.
						</h1>
					</div>
				</div>

				<p className="relative font-mono text-xs/4 text-muted-foreground">
					Built securely on top of{" "}
					<a
						href="#"
						target="_blank"
						rel="noreferrer"
						className="underline underline-offset-4 hover:text-foreground"
					>
						OneCMS Platform
					</a>
				</p>
			</section>

			<section className="flex min-h-svh flex-col bg-background px-6 py-8 sm:px-10 lg:px-14">
				<div className="flex gap-2 text-sm/5 max-lg:hidden lg:invisible">
          <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs mr-2">1</div>
          <span className="font-bold">OneCMS</span>
				</div>

				<div className="flex flex-1 items-center justify-center py-12">
					<div className="flex w-full max-w-sm flex-col gap-8">{children}</div>
				</div>
			</section>
		</main>
	);
}

export function AuthHeading({
	title,
	description,
}: {
	title: string;
	description: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3 text-left">
      <div className="flex lg:hidden mb-4 items-center">
        <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs mr-2">1</div>
        <span className="font-bold text-xl">OneCMS</span>
      </div>
			<div className="flex flex-col gap-1">
				<h2 className="text-2xl/8 font-semibold tracking-tight text-balance">
					{title}
				</h2>
				<p className="max-w-[32ch] text-sm/5 text-muted-foreground text-pretty">
					{description}
				</p>
			</div>
		</div>
	);
}
