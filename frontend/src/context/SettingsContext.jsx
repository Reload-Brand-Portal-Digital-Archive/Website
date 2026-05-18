import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/settings/public');
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch public settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}
