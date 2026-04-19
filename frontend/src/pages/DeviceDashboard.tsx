import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI } from '../services/api';

// Define the Device interface to match the expected structure of device data from 
// the backend API.
interface Device {
    id: number;
    macAddress: string;
    name: string;
    lastSeen: string;
    onlineStatus: string;
    lastTelemetry?: {
        lightLevel: number;
        noiseLevel: number;
        motionDetected: boolean;
    };
}

// The DeviceDashboard component fetches and displays a list of devices.
// It uses React hooks for state management and side effects.
// The component navigates to the device detail page when a device is clicked.
export default function DeviceDashboard(){
    const [devices, setDevices] = useState<Device[]>([]); // State to hold the list of devices
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const navigate = useNavigate(); // Hook to programmatically navigate to different routes

    // Fetch devices when the component mounts or when the component is updated. 
    useEffect(() => {
        fetchDevices();
        
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchDevices();
            }, 3000); // Refresh every 3 seconds
        }
        
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // The fetchDevices function makes an HTTP GET request to the backend API to retrieve
    // the list of devices. It handles loading states and errors appropriately.
    const fetchDevices = async () => {
        try{
            const response = await deviceAPI.getDevices(); // Make the API request to fetch devices
            setDevices(response.data); // Update the devices state with the data received from the API
            setLoading(false);
        } catch(err: any){
            // Handle errors by setting the error state with a message from the response or a default message
            setError(err.response?.data?.message || 'Failed to fetch devices');
            setLoading(false);
        }
    };

    // Render loading, error, or the list of devices based on the current state. 
    if(loading) return <div className="p-4 text-center text-lg">Loading devices...</div>;
    if(error) return <div className="p-4 text-red-600 text-center">Error: {error}</div>;

    // Each device is displayed in a card format, and clicking on a device navigates to its detail page using 
    // the navigate function.
    return(
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">🏠 Smart Home Devices</h1>
                <label className="flex items-center gap-2 cursor-pointer bg-white rounded-lg px-4 py-2 shadow">
                    <input 
                        type="checkbox" 
                        checked={autoRefresh} 
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Live Updates</span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Map through the devices array and render a card for each device. Each card displays the 
                device's name, MAC address, online status, and last seen time. The card is clickable and navigates to 
                the device's detail page when clicked. The online status is styled differently based on whether the 
                device is online or offline. If there are no devices, a message is displayed to the user. */}
                {devices.map(device => (
                    <div 
                        key={device.id}
                        className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all transform hover:scale-105"
                        onClick={() => navigate(`/devices/${device.id}`)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-xl text-gray-800">{device.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                device.onlineStatus === 'ONLINE' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {device.onlineStatus === 'ONLINE' ? '🟢 Online' : '🔴 Offline'}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            <span className="font-mono">📍 {device.macAddress}</span>
                        </p>

                        {/* Sensor Indicators */}
                        {device.lastTelemetry && (
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-yellow-50 rounded p-2 text-center">
                                    <p className="text-xs text-gray-600">💡 Light</p>
                                    <p className="text-sm font-bold text-yellow-600">{device.lastTelemetry.lightLevel}</p>
                                </div>
                                <div className="bg-blue-50 rounded p-2 text-center">
                                    <p className="text-xs text-gray-600">🔊 Noise</p>
                                    <p className="text-sm font-bold text-blue-600">{device.lastTelemetry.noiseLevel}</p>
                                </div>
                                <div className={`rounded p-2 text-center ${device.lastTelemetry.motionDetected ? 'bg-red-50' : 'bg-gray-50'}`}>
                                    <p className="text-xs text-gray-600">🚨 Motion</p>
                                    <p className={`text-sm font-bold ${device.lastTelemetry.motionDetected ? 'text-red-600' : 'text-gray-600'}`}>
                                        {device.lastTelemetry.motionDetected ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-gray-500 border-t pt-2">
                            Last updated: {new Date(device.lastSeen).toLocaleTimeString()}
                        </p>
                    </div>
                ))}
            </div>
            {devices.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-2xl text-gray-500 mb-4">📦 No devices found</p>
                    <p className="text-gray-600">Register a device to get started</p>
                </div>
            )}
        </div>
    );
}

