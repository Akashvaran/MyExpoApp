import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/components/MainRouding';
// import Map from './src/components/chat/Map';


export default function App() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <AppNavigator/>
                {/* <Map/> */}
            </SafeAreaView>
        </SafeAreaProvider>
    );
} 