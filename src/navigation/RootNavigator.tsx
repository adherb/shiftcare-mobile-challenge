import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DoctorsListScreen from '../screens/DoctorsListScreen';
import DoctorDetailScreen from '../screens/DoctorDetailScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';

export type RootStackParamList = {
  DoctorsList: undefined;
  DoctorDetail: { doctorName: string };
  BookingConfirmation: { bookingId: string };
  MyBookings: undefined;
  // TODO: Refine param types as you build out screen props
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="DoctorsList">
      <Stack.Screen
        name="DoctorsList"
        component={DoctorsListScreen}
        options={{ title: 'Doctors' }}
      />
      <Stack.Screen
        name="DoctorDetail"
        component={DoctorDetailScreen}
        options={{ title: 'Doctor Detail' }}
      />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{ title: 'Booking Confirmed' }}
      />
      <Stack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: 'My Bookings' }}
      />
    </Stack.Navigator>
  );
}
