import { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MimoPrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn("h-[52px] w-full rounded-xl text-base font-semibold shadow-mimo-sm", className)}
      {...props}
    />
  ),
);
MimoPrimaryButton.displayName = "MimoPrimaryButton";
