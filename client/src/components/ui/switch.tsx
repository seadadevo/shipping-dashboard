import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "../../lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <>
      <SwitchPrimitive.Root
        data-slot="switch"
        className={cn(
          "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            "bg-white dark:bg-slate-900 pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )}
        />
      </SwitchPrimitive.Root>

      {/* CSS مباشر جوه الملف */}
      <style dangerouslySetInnerHTML={{__html: `
  [data-slot="switch"] {
    background-color: #755c5cff;
  }
  [data-slot="switch"][data-state="checked"] {
    background-color: #3b82f6;
  }
  [data-slot="switch"]:focus-visible {
    box-shadow: 0 0 0 3px rgba(59,130,246,0.5);
  }
  [data-slot="switch"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  [data-slot="switch-thumb"] {
    width: 1rem;
    height: 1rem;
    border-radius: 9999px;
    transition: transform 0.2s;
    transform: translateX(0);
  }
  [data-slot="switch"][data-state="checked"] [data-slot="switch-thumb"] {
    transform: translateX(calc(100% - 42px));
  }
  .dark [data-slot="switch"][data-state="unchecked"] {
    background-color: rgba(229, 231, 235, 0.8);
  }
  .dark [data-slot="switch-thumb"] {
    background-color: #1e293b;
  }
`}} />
    </>
  )
}

export { Switch }
