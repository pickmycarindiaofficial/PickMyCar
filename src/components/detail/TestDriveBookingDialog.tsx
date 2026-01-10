import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, MapPin, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useTestDriveBooking } from '@/hooks/useTestDriveBooking';
import { useUpdateTestDriveBooking } from '@/hooks/useUpdateTestDriveBooking';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

// 1-hour time slots from 10:00 AM to 5:30 PM
const TIME_SLOTS = [
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-17:30'
];

interface TestDriveBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  dealerId: string;
  dealerName: string;
  showroomAddress: string;
  editMode?: boolean;
  existingBooking?: any;
}

export function TestDriveBookingDialog({
  open,
  onOpenChange,
  carId,
  dealerId,
  dealerName,
  showroomAddress,
  editMode = false,
  existingBooking,
}: TestDriveBookingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { mutate: bookTestDrive, isPending: isCreating } = useTestDriveBooking();
  const { mutate: updateTestDrive, isPending: isUpdating } = useUpdateTestDriveBooking();

  const isPending = isCreating || isUpdating;

  // Fetch booked slots for the selected date and specific car
  const { data: availableSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['available-slots', carId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];

      // Query test_drive_bookings for this specific car on this date
      // @ts-ignore - test_drive_bookings not in generated types
      const { data: bookedSlots, error } = await supabase
        .from('test_drive_bookings')
        .select('time_slot')
        .eq('car_listing_id', carId)
        .eq('preferred_date', format(selectedDate, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;

      // Map slots with availability
      return TIME_SLOTS.map(slot => ({
        time_slot: slot,
        is_available: !bookedSlots?.some(b => b.time_slot === slot)
      }));
    },
    enabled: !!selectedDate && !!carId,
  });

  // Pre-fill form if editing existing booking
  useEffect(() => {
    if (editMode && existingBooking) {
      setSelectedDate(new Date(existingBooking.preferred_date));
      setTimeSlot(existingBooking.time_slot);
      setNotes(existingBooking.notes || '');
    }
  }, [editMode, existingBooking]);

  const handleSubmit = () => {
    if (!selectedDate || !timeSlot) return;

    const bookingData = {
      carId,
      dealerId,
      preferredDate: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot,
      notes,
      showroomAddress,
    };

    if (editMode && existingBooking) {
      updateTestDrive(
        {
          bookingId: existingBooking.id,
          ...bookingData,
        },
        {
          onSuccess: () => {
            setBookingSuccess(true);
            setTimeout(() => {
              onOpenChange(false);
              setBookingSuccess(false);
              setSelectedDate(undefined);
              setTimeSlot('');
              setNotes('');
            }, 3000);
          },
        }
      );
    } else {
      bookTestDrive(
        bookingData,
        {
          onSuccess: () => {
            setBookingSuccess(true);
            setTimeout(() => {
              onOpenChange(false);
              setBookingSuccess(false);
              setSelectedDate(undefined);
              setTimeSlot('');
              setNotes('');
            }, 3000);
          },
        }
      );
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl p-0 gap-0 max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            {editMode ? 'Reschedule Test Drive' : 'Book a Free Test Drive'}
          </DialogTitle>
        </DialogHeader>

        {bookingSuccess ? (
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
            <div className="text-center space-y-4 max-w-md">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {editMode ? 'Booking Updated!' : 'Booking Confirmed!'}
              </h3>
              <p className="text-muted-foreground">
                {editMode
                  ? 'Your test drive has been rescheduled. You will receive a confirmation on WhatsApp.'
                  : 'Your test drive has been booked successfully! You will receive a confirmation on WhatsApp.'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="space-y-6">
                {/* Calendar Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    Select Preferred Date
                  </Label>
                  <div className="w-full">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      className="rounded-lg border shadow-sm w-full"
                      classNames={{
                        months: "flex w-full",
                        month: "w-full space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full",
                        head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1",
                        row: "flex w-full mt-2",
                        cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                      initialFocus
                    />
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div className="space-y-2">
                  <Label htmlFor="time-slot" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Select Time Slot (1 Hour Duration)
                  </Label>
                  <Select value={timeSlot} onValueChange={setTimeSlot} disabled={!selectedDate}>
                    <SelectTrigger id="time-slot" className="w-full">
                      <SelectValue placeholder={selectedDate ? "Choose your preferred time" : "Select a date first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {slotsLoading ? (
                        <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking availability...
                        </div>
                      ) : availableSlots && availableSlots.length > 0 ? (
                        availableSlots.map((slot: any) => (
                          <SelectItem
                            key={slot.time_slot}
                            value={slot.time_slot}
                            disabled={!slot.is_available}
                            className={!slot.is_available ? 'opacity-50' : ''}
                          >
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {slot.time_slot}
                              </div>
                              {slot.is_available ? (
                                <span className="text-xs text-green-600 dark:text-green-500 font-medium">✓ Available</span>
                              ) : (
                                <span className="text-xs text-red-600 dark:text-red-500 font-medium flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Booked
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground">
                          {selectedDate ? 'No slots available for this date' : 'Please select a date first'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedDate && availableSlots && availableSlots.every((s: any) => !s.is_available) && (
                    <p className="text-xs text-destructive">All slots are booked for this date. Please select another date.</p>
                  )}
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold text-foreground">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any specific requirements or questions?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full resize-none min-h-[100px]"
                  />
                </div>

                {/* Showroom Address Section */}
                <div className="rounded-xl bg-muted/50 border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Showroom Location</p>
                      <p className="text-sm font-medium text-foreground">{dealerName}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pl-10">{showroomAddress}</p>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t bg-background">
              <Button
                onClick={handleSubmit}
                disabled={!selectedDate || !timeSlot || isPending}
                className="w-full h-12 text-base font-semibold"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editMode ? 'Updating...' : 'Confirming...'}
                  </span>
                ) : (
                  editMode ? 'Update Booking' : 'Confirm Booking'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
