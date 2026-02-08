import React, { useState, useEffect } from 'react';

interface LRIDSData {
  lab_no: string;
  test_name: string;
  status: 'pending' | 'processing' | 'completed' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  location: string;
  last_update: string;
  technician?: string;
}

const LRIDS: React.FC = () => {
  const [data, setData] = useState<LRIDSData[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    fetchData();
    
    // Update time every second
    const timeInterval = setInterval(updateDateTime, 1000);
    
    // Auto-refresh data every 10 seconds (real-time)
    const dataInterval = setInterval(fetchData, 10000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Simulated data - replace with actual API call
      const mockData: LRIDSData[] = [
        {
          lab_no: 'LAB-2025-00123',
          test_name: 'Complete Blood Count',
          status: 'processing',
          priority: 'high',
          location: 'Hematology Lab',
          last_update: new Date().toISOString(),
          technician: 'Dr. Smith'
        },
        {
          lab_no: 'LAB-2025-00124',
          test_name: 'Lipid Profile',
          status: 'pending',
          priority: 'medium',
          location: 'Chemistry Lab',
          last_update: new Date().toISOString(),
          technician: 'Dr. Johnson'
        },
        {
          lab_no: 'LAB-2025-00125',
          test_name: 'Liver Function Test',
          status: 'completed',
          priority: 'low',
          location: 'Chemistry Lab',
          last_update: new Date().toISOString(),
          technician: 'Dr. Williams'
        },
        {
          lab_no: 'LAB-2025-00126',
          test_name: 'Urine Analysis',
          status: 'urgent',
          priority: 'high',
          location: 'Microbiology',
          last_update: new Date().toISOString(),
          technician: 'Dr. Brown'
        },
        {
          lab_no: 'LAB-2025-00127',
          test_name: 'Blood Culture',
          status: 'processing',
          priority: 'high',
          location: 'Microbiology',
          last_update: new Date().toISOString(),
          technician: 'Dr. Davis'
        },
      ];
      setData(mockData);
    } catch (error) {
      console.error('Error fetching LRIDS data:', error);
    }
  };

  const updateDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setCurrentDateTime(`${date} | ${time}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'urgent':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 font-bold';
      case 'medium':
        return 'text-yellow-600 font-bold';
      case 'low':
        return 'text-green-600 font-bold';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'COMPLETED';
      case 'processing':
        return 'IN PROCESS';
      case 'pending':
        return 'PENDING';
      case 'urgent':
        return 'URGENT';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <div className="lrids-page" style={{
      backgroundColor: '#21336a',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src="/images/logo-nakasero.png"
            alt="Nakasero Hospital"
            style={{ height: '80px' }}
          />
          <div>
            <h1 style={{
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: '700',
              margin: '0'
            }}>
              Live Results Information Display System
            </h1>
            <div style={{
              color: '#deab5f',
              fontSize: '1.2rem',
              marginTop: '5px'
            }}>
              NHL Laboratory - Real-time Test Tracking
            </div>
          </div>
        </div>
        
        {/* Current Date & Time */}
        <div style={{
          color: 'white',
          textAlign: 'right',
          fontSize: '1.1rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {currentDateTime.split(' | ')[0]}
          </div>
          <div style={{ 
            fontSize: '1.3rem',
            color: '#deab5f',
            fontWeight: '600' 
          }}>
            {currentDateTime.split(' | ')[1]}
          </div>
        </div>
      </div>

      {/* LRIDS Display Board */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        marginBottom: '30px'
      }}>
        {/* Table Header */}
        <div style={{
          backgroundColor: '#21336a',
          padding: '20px 30px',
          display: 'grid',
          gridTemplateColumns: '2fr 3fr 1.5fr 1.5fr 2fr 2fr',
          gap: '20px',
          alignItems: 'center',
          borderBottom: '3px solid #deab5f'
        }}>
          {['LAB NUMBER', 'TEST NAME', 'STATUS', 'PRIORITY', 'LOCATION', 'TECHNICIAN'].map((header, index) => (
            <div key={index} style={{
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {header}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {data.map((item, index) => (
            <div 
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 3fr 1.5fr 1.5fr 2fr 2fr',
                gap: '20px',
                padding: '25px 30px',
                alignItems: 'center',
                borderBottom: '1px solid #eee',
                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8f4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
              }}
            >
              {/* Lab Number */}
              <div style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                color: '#21336a'
              }}>
                {item.lab_no}
              </div>

              {/* Test Name */}
              <div style={{
                fontSize: '1.1rem',
                color: '#333',
                fontWeight: '500'
              }}>
                {item.test_name}
              </div>

              {/* Status */}
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  backgroundColor: getStatusColor(item.status)
                }}>
                  {getStatusText(item.status)}
                </span>
              </div>

              {/* Priority */}
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                ...(getPriorityColor(item.priority) as any)
              }}>
                {item.priority.toUpperCase()}
              </div>

              {/* Location */}
              <div style={{
                fontSize: '1rem',
                color: '#555',
                fontWeight: '500'
              }}>
                {item.location}
              </div>

              {/* Technician */}
              <div style={{
                fontSize: '1rem',
                color: '#21336a',
                fontWeight: '500'
              }}>
                {item.technician || 'Not Assigned'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px'
      }}>
        <div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            <i className="fas fa-sync-alt" style={{ marginRight: '8px' }}></i>
            Real-time updates every 10 seconds
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>
            Last Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#deab5f' }}>
            Total Active Tests: {data.length}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>
            NHL Laboratory Information System
          </div>
        </div>
      </div>

      {/* Zyntel Logo */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        opacity: 0.7,
        transition: 'opacity 0.3s',
        zIndex: 100
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <img
          src="/images/zyntel_no_background.png"
          alt="Zyntel"
          style={{ height: '150px' }}
        />
      </div>
    </div>
  );
};

export default LRIDS;