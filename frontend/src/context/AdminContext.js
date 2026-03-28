import React, { createContext, useReducer, useCallback } from 'react';

export const AdminContext = createContext();

// Initial state for admin features
const initialState = {
  eventTypes: [],
  bookings: [],
  schedules: [],
  loading: true,
  selectedEventType: null,
  selectedBooking: null,
  showForm: false,
  formType: null, // 'create' or 'edit'
  filters: {
    status: 'all', // 'all', 'confirmed', 'cancelled', 'pending'
    dateRange: 'upcoming', // 'upcoming', 'past', 'all'
    searchTerm: ''
  },
  submitting: false,
};

// Action types
export const ADMIN_ACTIONS = {
  SET_EVENT_TYPES: 'SET_EVENT_TYPES',
  SET_BOOKINGS: 'SET_BOOKINGS',
  SET_SCHEDULES: 'SET_SCHEDULES',
  SET_LOADING: 'SET_LOADING',
  SET_SELECTED_EVENT_TYPE: 'SET_SELECTED_EVENT_TYPE',
  SET_SELECTED_BOOKING: 'SET_SELECTED_BOOKING',
  SET_SHOW_FORM: 'SET_SHOW_FORM',
  SET_FORM_TYPE: 'SET_FORM_TYPE',
  SET_FILTERS: 'SET_FILTERS',
  SET_SUBMITTING: 'SET_SUBMITTING',
  RESET_FORM: 'RESET_FORM',
  ADD_EVENT_TYPE: 'ADD_EVENT_TYPE',
  UPDATE_EVENT_TYPE: 'UPDATE_EVENT_TYPE',
  DELETE_EVENT_TYPE: 'DELETE_EVENT_TYPE',
  ADD_BOOKING: 'ADD_BOOKING',
  UPDATE_BOOKING: 'UPDATE_BOOKING',
  DELETE_BOOKING: 'DELETE_BOOKING',
};

// Reducer function
function adminReducer(state, action) {
  switch (action.type) {
    case ADMIN_ACTIONS.SET_EVENT_TYPES:
      return { ...state, eventTypes: action.payload };
    
    case ADMIN_ACTIONS.SET_BOOKINGS:
      return { ...state, bookings: action.payload };
    
    case ADMIN_ACTIONS.SET_SCHEDULES:
      return { ...state, schedules: action.payload };
    
    case ADMIN_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ADMIN_ACTIONS.SET_SELECTED_EVENT_TYPE:
      return { ...state, selectedEventType: action.payload };
    
    case ADMIN_ACTIONS.SET_SELECTED_BOOKING:
      return { ...state, selectedBooking: action.payload };
    
    case ADMIN_ACTIONS.SET_SHOW_FORM:
      return { ...state, showForm: action.payload };
    
    case ADMIN_ACTIONS.SET_FORM_TYPE:
      return { ...state, formType: action.payload };
    
    case ADMIN_ACTIONS.SET_FILTERS:
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload }
      };
    
    case ADMIN_ACTIONS.SET_SUBMITTING:
      return { ...state, submitting: action.payload };
    
    case ADMIN_ACTIONS.RESET_FORM:
      return {
        ...state,
        showForm: false,
        formType: null,
        selectedEventType: null,
      };
    
    case ADMIN_ACTIONS.ADD_EVENT_TYPE:
      return {
        ...state,
        eventTypes: [...state.eventTypes, action.payload]
      };
    
    case ADMIN_ACTIONS.UPDATE_EVENT_TYPE:
      return {
        ...state,
        eventTypes: state.eventTypes.map(et =>
          et.id === action.payload.id ? action.payload : et
        )
      };
    
    case ADMIN_ACTIONS.DELETE_EVENT_TYPE:
      return {
        ...state,
        eventTypes: state.eventTypes.filter(et => et.id !== action.payload)
      };
    
    case ADMIN_ACTIONS.ADD_BOOKING:
      return {
        ...state,
        bookings: [action.payload, ...state.bookings]
      };
    
    case ADMIN_ACTIONS.UPDATE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.payload.id ? action.payload : b
        )
      };
    
    case ADMIN_ACTIONS.DELETE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.filter(b => b.id !== action.payload)
      };
    
    default:
      return state;
  }
}

// Provider component
export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  const value = {
    ...state,
    dispatch,
    // Action creators for easier usage
    setEventTypes: useCallback(
      (types) => dispatch({ type: ADMIN_ACTIONS.SET_EVENT_TYPES, payload: types }),
      []
    ),
    setBookings: useCallback(
      (bookings) => dispatch({ type: ADMIN_ACTIONS.SET_BOOKINGS, payload: bookings }),
      []
    ),
    setSchedules: useCallback(
      (schedules) => dispatch({ type: ADMIN_ACTIONS.SET_SCHEDULES, payload: schedules }),
      []
    ),
    setLoading: useCallback(
      (loading) => dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: loading }),
      []
    ),
    setSelectedEventType: useCallback(
      (et) => dispatch({ type: ADMIN_ACTIONS.SET_SELECTED_EVENT_TYPE, payload: et }),
      []
    ),
    setSelectedBooking: useCallback(
      (b) => dispatch({ type: ADMIN_ACTIONS.SET_SELECTED_BOOKING, payload: b }),
      []
    ),
    setShowForm: useCallback(
      (show) => dispatch({ type: ADMIN_ACTIONS.SET_SHOW_FORM, payload: show }),
      []
    ),
    setFormType: useCallback(
      (type) => dispatch({ type: ADMIN_ACTIONS.SET_FORM_TYPE, payload: type }),
      []
    ),
    setFilters: useCallback(
      (filters) => dispatch({ type: ADMIN_ACTIONS.SET_FILTERS, payload: filters }),
      []
    ),
    setSubmitting: useCallback(
      (submitting) => dispatch({ type: ADMIN_ACTIONS.SET_SUBMITTING, payload: submitting }),
      []
    ),
    resetForm: useCallback(
      () => dispatch({ type: ADMIN_ACTIONS.RESET_FORM }),
      []
    ),
    addEventType: useCallback(
      (type) => dispatch({ type: ADMIN_ACTIONS.ADD_EVENT_TYPE, payload: type }),
      []
    ),
    updateEventType: useCallback(
      (type) => dispatch({ type: ADMIN_ACTIONS.UPDATE_EVENT_TYPE, payload: type }),
      []
    ),
    deleteEventType: useCallback(
      (id) => dispatch({ type: ADMIN_ACTIONS.DELETE_EVENT_TYPE, payload: id }),
      []
    ),
    addBooking: useCallback(
      (booking) => dispatch({ type: ADMIN_ACTIONS.ADD_BOOKING, payload: booking }),
      []
    ),
    updateBooking: useCallback(
      (booking) => dispatch({ type: ADMIN_ACTIONS.UPDATE_BOOKING, payload: booking }),
      []
    ),
    deleteBooking: useCallback(
      (id) => dispatch({ type: ADMIN_ACTIONS.DELETE_BOOKING, payload: id }),
      []
    ),
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
