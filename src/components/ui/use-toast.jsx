import { toast as sonnerToast } from 'sonner';

/** The account screens call toast({ title, description }). */
export function toast({ title, description } = {}) {
  return sonnerToast(title ?? '', description ? { description } : undefined);
}

export function useToast() {
  return { toast };
}