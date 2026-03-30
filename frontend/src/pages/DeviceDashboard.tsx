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
}

// The DeviceDashboard component fetches and displays a list of devices.
// It uses React hooks for state management and side effects.
// The component navigates to the device detail page when a device is clicked.
export default function DeviceDashboard(){
    const [devices, setDevices] = useState<Device[]>([]); // State to hold the list of devices
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Hook to programmatically navigate to different routes

    // Fetch devices when the component mounts or when the component is updated. 
    useEffect(() => {
        fetchDevices();
    }, []);

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
    if(loading) return <div className="p-4">Loading devices...</div>;
    if(error) return <div className="p-4 text-red-600">Error: {error}</div>;

    // Each device is displayed in a card format, and clicking on a device navigates to its detail page using 
    // the navigate function.
    return(
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">My Smart Home Devices</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Map through the devices array and render a card for each device. Each card displays the 
                device's name, MAC address, online status, and last seen time. The card is clickable and navigates to 
                the device's detail page when clicked. The online status is styled differently based on whether the 
                device is online or offline. If there are no devices, a message is displayed to the user. */}
                {devices.map(device => (
                    <div 
                        key={device.id}
                        className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => navigate(`/devices/${device.id}`)}
                    >
                        <h3 className="font-bold text-lg">{device.name}</h3>
                        <p className="text-sm text-gray-600">MAC: {device.macAddress}</p>
                        <p className={`text-sm font-semibold ${device.onlineStatus === 'ONLINE' ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {device.onlineStatus}
                        </p>
                        <p className="text-xs text-gray-500">Last seen: {new Date(device.lastSeen).toLocaleString()}</p>
                    </div>
                ))}
            </div>
            {devices.length === 0 && (
                <p className="text-center text-gray-500">No devices found. Register a device to get started.</p>
            )}

        </div>
    );
}

