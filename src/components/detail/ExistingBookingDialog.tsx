import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface ExistingBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    preferred_date: string;
    time_slot: string;
  };
  onEdit: () => void;
  onCancel: () => void;
}

export function ExistingBookingDialog({
  open,
  onOpenChange,
  booking,
  onEdit,
  onCancel
}: ExistingBookingDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Existing Test Drive Booking
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <p className="text-foreground/80">You already have a test drive booked for this car:</p>
            
            <div className="rounded-xl bg-muted/50 border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled Date</p>
                  <p className="font-semibold text-foreground">
                    {format(new Date(booking.preferred_date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Slot</p>
                  <p className="font-semibold text-foreground">{booking.time_slot}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-foreground/70">
              Would you like to change the date and time of your test drive?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel} className="w-full sm:w-auto">
            Keep Current Booking
          </AlertDialogCancel>
          <AlertDialogAction onClick={onEdit} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            Change Date & Time
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
