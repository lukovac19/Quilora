"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react@0.487.0";

import { cn } from "./utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

// Lightweight stub implementation without cmdk dependency
// This component is not actively used in the application

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {}

function Command({ className, ...props }: CommandProps) {
  return (
    <div
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[data-slot=command-input-wrapper]]:h-12">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function CommandInput({ className, ...props }: CommandInputProps) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

function CommandList({ className, ...props }: CommandListProps) {
  return (
    <div
      data-slot="command-list"
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

function CommandEmpty({ ...props }: CommandEmptyProps) {
  return (
    <div
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  );
}

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

function CommandGroup({ className, ...props }: CommandGroupProps) {
  return (
    <div
      data-slot="command-group"
      className={cn(
        "text-foreground overflow-hidden p-1",
        className,
      )}
      {...props}
    />
  );
}

interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

function CommandSeparator({ className, ...props }: CommandSeparatorProps) {
  return (
    <div
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  );
}

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {}

function CommandItem({ className, ...props }: CommandItemProps) {
  return (
    <div
      data-slot="command-item"
      className={cn(
        "hover:bg-accent hover:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

interface CommandShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
