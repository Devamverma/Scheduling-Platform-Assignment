import React, { createContext, useReducer, useCallback } from 'react';

export const BookingContext = createContext();

// Initial state
const initialState = {
  eventType: null,
  loading: true,
  currentMonth: new Date(),
  selectedDate: null,
  selectedTime: null,
  slots: [],
  slotsLoading: false,
  timezone: typeof Intl !== 'undefined' 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : 'America/New_York',
  showForm: false,
  formData: {
    name: '',
    email: '',
    notes: ''
  },
  submitting: false,
};

// Action types
export const BOOKING_ACTIONS = {
  SET_EVENT_TYPE: 'SET_EVENT_TYPE',
  SET_LOADING: 'SET_LOADING',
  SET_CURRENT_MONTH: 'SET_CURRENT_MONTH',
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  SET_SELECTED_TIME: 'SET_SELECTED_TIME',
  SET_SLOTS: 'SET_SLOTS',
  SET_SLOTS_LOADING: 'SET_SLOTS_LOADING',
  SET_TIMEZONE: 'SET_TIMEZONE',
  SET_SHOW_FORM: 'SET_SHOW_FORM',
  SET_FORM_DATA: 'SET_FORM_DATA',
  SET_SUBMITTING: 'SET_SUBMITTING',
  RESET_BOOKING: 'RESET_BOOKING',
  RESET_TIME_AND_FORM: 'RESET_TIME_AND_FORM',
};

// Reducer function
function bookingReducer(state, action) {
  switch (action.type) {
    case BOOKING_ACTIONS.SET_EVENT_TYPE:
      return { ...state, eventType: action.payload };
    
    case BOOKING_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case BOOKING_ACTIONS.SET_CURRENT_MONTH:
      return { ...state, currentMonth: action.payload };
    
    case BOOKING_ACTIONS.SET_SELECTED_DATE:
      return { 
        ...state, 
        selectedDate: action.payload,
        selectedTime: null,
        showForm: false
      };
    
    case BOOKING_ACTIONS.SET_SELECTED_TIME:
      return { 
        ...state, 
        selectedTime: action.payload,
        showForm: true
      };
    
    case BOOKING_ACTIONS.SET_SLOTS:
      return { ...state, slots: action.payload };
    
    case BOOKING_ACTIONS.SET_SLOTS_LOADING:
      return { ...state, slotsLoading: action.payload };
    
    case BOOKING_ACTIONS.SET_TIMEZONE:
      return { ...state, timezone: action.payload };
    
    case BOOKING_ACTIONS.SET_SHOW_FORM:
      return { ...state, showForm: action.payload };
    
    case BOOKING_ACTIONS.SET_FORM_DATA:
      return { 
        ...state, 
        formData: { ...state.formData, ...action.payload }
      };
    
    case BOOKING_ACTIONS.SET_SUBMITTING:
      return { ...state, submitting: action.payload };
    
    case BOOKING_ACTIONS.RESET_BOOKING:
      return initialState;
    
    case BOOKING_ACTIONS.RESET_TIME_AND_FORM:
      return {
        ...state,
        selectedTime: null,
        showForm: false,
        formData: { name: '', email: '', notes: '' }
      };
    
    default:
      return state;
  }
}

// Provider component
export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const value = {
    ...state,
    dispatch,
    // Action creators for easier usage
    setEventType: useCallback(
      (eventType) => dispatch({ type: BOOKING_ACTIONS.SET_EVENT_TYPE, payload: eventType }),
      []
    ),
    setLoading: useCallback(
      (loading) => dispatch({ type: BOOKING_ACTIONS.SET_LOADING, payload: loading }),
      []
    ),
    setCurrentMonth: useCallback(
      (month) => dispatch({ type: BOOKING_ACTIONS.SET_CURRENT_MONTH, payload: month }),
      []
    ),
    setSelectedDate: useCallback(
      (date) => dispatch({ type: BOOKING_ACTIONS.SET_SELECTED_DATE, payload: date }),
      []
    ),
    setSelectedTime: useCallback(
      (time) => dispatch({ type: BOOKING_ACTIONS.SET_SELECTED_TIME, payload: time }),
      []
    ),
    setSlots: useCallback(
      (slots) => dispatch({ type: BOOKING_ACTIONS.SET_SLOTS, payload: slots }),
      []
    ),
    setSlotsLoading: useCallback(
      (loading) => dispatch({ type: BOOKING_ACTIONS.SET_SLOTS_LOADING, payload: loading }),
      []
    ),
    setTimezone: useCallback(
      (tz) => dispatch({ type: BOOKING_ACTIONS.SET_TIMEZONE, payload: tz }),
      []
    ),
    setShowForm: useCallback(
      (show) => dispatch({ type: BOOKING_ACTIONS.SET_SHOW_FORM, payload: show }),
      []
    ),
    setFormData: useCallback(
      (data) => dispatch({ type: BOOKING_ACTIONS.SET_FORM_DATA, payload: data }),
      []
    ),
    setSubmitting: useCallback(
      (submitting) => dispatch({ type: BOOKING_ACTIONS.SET_SUBMITTING, payload: submitting }),
      []
    ),
    resetBooking: useCallback(
      () => dispatch({ type: BOOKING_ACTIONS.RESET_BOOKING }),
      []
    ),
    resetTimeAndForm: useCallback(
      () => dispatch({ type: BOOKING_ACTIONS.RESET_TIME_AND_FORM }),
      []
    ),
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}
