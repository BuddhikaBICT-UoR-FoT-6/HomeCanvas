import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceAPI } from '../services/api';

// TypeScript interfaces for device details, telemetry, and actions - 
// these should match the backend API responses 
interface SensorReading {
  id: number;
  timestamp: string;
  lightLevel: number;
  noiseLevel: number;
  motionDetected: boolean;
}

interface ActionLog {
  id: number;
  actionType: string;
  triggeredAt: string;
}

interface DeviceDetail {
  id: number;
  name: string;
  macAddress: string;
  onlineStatus: string;
  lastSeen: string;
  createdAt: string;
  lastTelemetry: SensorReading;
  owner: { id: number; username: string };
}

// DeviceDetail component to show detailed information about a specific device, including 
// its telemetry and action logs fetched from the backend API 
export default function DeviceDetail() {
  const { id } = useParams(); // Get device ID from URL parameters
  const navigate = useNavigate(); // Hook to programmatically navigate between routes
  const [device, setDevice] = useState<DeviceDetail | null>(null); // State to hold device details
  const [telemetry, setTelemetry] = useState<SensorReading[]>([]); // State to hold telemetry data
  const [actions, setActions] = useState<ActionLog[]>([]); // State to hold action logs
  const [loading, setLoading] = useState(true); // State to manage loading state of the component
  const [tab, setTab] = useState<'overview' | 'telemetry' | 'actions'>('overview'); // State to manage 
  // which tab is currently active

  // useEffect to fetch device details, telemetry, and actions when the component mounts or when the device ID changes 
  useEffect(() => {
    fetchDeviceDetail();
  }, [id]);

  // function to fetch device details, telemetry, and actions from the backend API using axios and 
  // update the component state accordingly  
  const fetchDeviceDetail = async () => {
    try {
      const deviceId = Number(id); // Convert ID string to number
    
      // Make concurrent API calls to fetch device details, telemetry, and actions using Promise.all 
      // for better performance 
      const [deviceRes, telemetryRes, actionsRes] = await Promise.all([
        deviceAPI.getDevice(deviceId),
        deviceAPI.getTelemetry(deviceId, 0, 10),
        deviceAPI.getActions(deviceId, 0, 10)
      ]);

      setDevice(deviceRes.data); // Update state with device details
      setTelemetry(telemetryRes.data.content); // Update state with telemetry data
      setActions(actionsRes.data.content); // Update state with action logs
      setLoading(false); // Set loading to false after data is fetched and state is updated
    } catch (err) {
      console.error('Failed to load device:', err);
      setLoading(false);
    }
  };

  // Render loading state, error state, and the main content of the device detail page with 
  // tabs for overview, telemetry, and actions 
  if (loading) return <div className="p-4">Loading device...</div>;
  if (!device) return <div className="p-4">Device not found</div>;

  return (
    <div className="container mx-auto p-4">
        {/* Back button to navigate back to the device dashboard using the useNavigate hook from react-router-dom 
        to programmatically navigate to the /devices route when clicked */}
      <button onClick={() => navigate('/devices')} className="mb-4 px-4 py-2 bg-gray-300 rounded">
        ← Back
      </button>
    
      {/* Display the device name as a heading at the top of the page */}
      <h1 className="text-3xl font-bold mb-4">{device.name}</h1>

      {/* Tabs */}
      {/* Tab navigation buttons to switch between overview, telemetry, and actions views */}
      <div className="flex gap-4 border-b mb-4">
        {['overview', 'telemetry', 'actions'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 ${tab === t ? 'border-b-2 border-blue-600 font-bold' : ''}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      // Content for the overview tab showing basic device information and latest telemetry data in a grid layout
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">MAC Address</p>
            <p className="font-semibold">{device.macAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className={`font-semibold ${device.onlineStatus === 'ONLINE' ? 'text-green-600' : 'text-red-600'}`}>
              {device.onlineStatus}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Seen</p>
            <p className="font-semibold">{new Date(device.lastSeen).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-semibold">{new Date(device.createdAt).toLocaleString()}</p>
          </div>
          {device.lastTelemetry && (
            <>
              <div>
                <p className="text-sm text-gray-600">Light Level</p>
                <p className="font-semibold">{device.lastTelemetry.lightLevel}/1023</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Noise Level</p>
                <p className="font-semibold">{device.lastTelemetry.noiseLevel}/1023</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Motion Detected</p>
                <p className={`font-semibold ${device.lastTelemetry.motionDetected ? 'text-orange-600' : 'text-gray-600'}`}>
                  {device.lastTelemetry.motionDetected ? 'Yes' : 'No'}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Telemetry Tab */}
      // Content for the telemetry tab showing sensor readings in a table format with columns for timestamp, light level, 
      // noise level, and motion detection status
      {tab === 'telemetry' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Timestamp</th>
                <th className="border p-2 text-left">Light</th>
                <th className="border p-2 text-left">Noise</th>
                <th className="border p-2 text-left">Motion</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.map((reading) => (
                <tr key={reading.id}>
                  <td className="border p-2">{new Date(reading.timestamp).toLocaleString()}</td>
                  <td className="border p-2">{reading.lightLevel}</td>
                  <td className="border p-2">{reading.noiseLevel}</td>
                  <td className="border p-2">{reading.motionDetected ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions Tab */}
      // Content for the actions tab showing action logs in a table format with columns for action type and trigger time 
      {tab === 'actions' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Action</th>
                <th className="border p-2 text-left">Triggered At</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id}>
                  <td className="border p-2 font-semibold">{action.actionType}</td>
                  <td className="border p-2">{new Date(action.triggeredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}