"use client";

import * as React from "react";
import { cn } from "./utils";

// Stub implementations to avoid vaul/framer-motion dependency
// These are not used in the application

function Drawer({ children, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer" {...props}>{children}</div>;
}

function DrawerTrigger({ ...props }: React.ComponentProps<"button">) {
  return <button data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ children, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-portal" {...props}>{children}</div>;
}

function DrawerClose({ ...props }: React.ComponentProps<"button">) {
  return <button data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="drawer-portal">
      <DrawerOverlay />
      <div
        data-slot="drawer-content"
        className={cn(
          "fixed z-50 flex h-auto flex-col bg-background",
          "inset-x-0 bottom-0 mt-24 max-h-[80vh] rounded-t-lg border-t",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
        {children}
      </div>
    </div>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="drawer-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
