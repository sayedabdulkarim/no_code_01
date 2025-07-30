/**
 * Time display format constants
 */
export const TIME_DISPLAY = {
  DEFAULT: '00:00:00',
  FORMAT: {
    MINUTES: 2,
    SECONDS: 2,
    HUNDREDTHS: 2,
  },
} as const;

/**
 * Update interval for the stopwatch (10ms for smooth hundredths updates)
 */
export const UPDATE_INTERVAL = 10;

/**
 * Time conversion constants
 */
export const TIME_CONVERSION = {
  MILLISECONDS_TO_HUNDREDTHS: 10,
  MILLISECONDS_TO_SECONDS: 1000,
  SECONDS_TO_MINUTES: 60,
} as const;

/**
 * Button states based on stopwatch state
 */
export const BUTTON_STATES = {
  START: {
    IDLE: true,
    RUNNING: false,
    STOPPED: true,
  },
  STOP: {
    IDLE: false,
    RUNNING: true,
    STOPPED: false,
  },
  RESET: {
    IDLE: true,
    RUNNING: true,
    STOPPED: true,
  },
} as const;