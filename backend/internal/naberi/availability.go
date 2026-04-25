package naberi

import "time"

const (
	bookingWindowDays = 14
	workdayStartHour  = 9
	workdayEndHour    = 18
	slotStepMinutes   = 30
)

func generateSlots(eventType EventType, now time.Time, location *time.Location) []TimeSlot {
	if location == nil {
		location = time.Local
	}

	localNow := now.In(location)
	windowStart := startOfDay(localNow, location)
	duration := time.Duration(eventType.Duration) * time.Minute
	step := time.Duration(slotStepMinutes) * time.Minute

	slots := make([]TimeSlot, 0)
	for day := 0; day < bookingWindowDays; day++ {
		date := windowStart.AddDate(0, 0, day)
		workdayStart := time.Date(date.Year(), date.Month(), date.Day(), workdayStartHour, 0, 0, 0, location)
		workdayEnd := time.Date(date.Year(), date.Month(), date.Day(), workdayEndHour, 0, 0, 0, location)

		for start := workdayStart; !start.Add(duration).After(workdayEnd); start = start.Add(step) {
			if !start.After(localNow) {
				continue
			}

			slots = append(slots, TimeSlot{
				StartTime: start.UTC(),
				EndTime:   start.Add(duration).UTC(),
			})
		}
	}

	return slots
}

func isBookableSlot(eventType EventType, requestedSlot TimeSlot, now time.Time, location *time.Location) bool {
	requestedStart := requestedSlot.StartTime.UTC()
	requestedEnd := requestedSlot.EndTime.UTC()

	for _, slot := range generateSlots(eventType, now, location) {
		if slot.StartTime.Equal(requestedStart) && slot.EndTime.Equal(requestedEnd) {
			return true
		}
	}

	return false
}

func startOfDay(value time.Time, location *time.Location) time.Time {
	local := value.In(location)
	return time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, location)
}
