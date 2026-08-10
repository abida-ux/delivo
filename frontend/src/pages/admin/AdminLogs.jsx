import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAdminLogs } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Terminal, Search, RefreshCw, ChevronLeft, ChevronRight, Monitor, Play, Trash2 } from 'lucide-react';
import './AdminLogs.css';

const AdminLogs = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [theme, setTheme] = useState('matrix'); // matrix, amber, cyberpunk, ubuntu
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  
  // Custom terminal command lines
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [showTerminalHelp, setShowTerminalHelp] = useState(false);
  const [terminalUserInfo, setTerminalUserInfo] = useState(null);
  const [mockCommandOutput, setMockCommandOutput] = useState(null);

  const fetchLogs = async (silent = false) => {
    if (!showLogs) return;
    if (!silent) setLoading(true);
    try {
      const data = await getAdminLogs(page, 30, search);
      if (data?.success) {
        setLogs(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalLogs(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load admin logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (showLogs) {
      fetchLogs();
    }
  }, [page, search, showLogs]);

  useEffect(() => {
    if (!isLive || !showLogs) return;
    const timer = setInterval(() => {
      fetchLogs(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [isLive, page, search, showLogs]);

  const handleCommandRun = (cmdText) => {
    const trimmed = cmdText.trim().toLowerCase();
    const historyLine = { cmd: cmdText, timestamp: new Date() };
    
    // Add command to terminal history
    setTerminalHistory(prev => [...prev, historyLine]);

    // Reset all helper views by default
    setShowTerminalHelp(false);
    setTerminalUserInfo(null);
    setMockCommandOutput(null);

    if (trimmed === 'help') {
      setShowTerminalHelp(true);
      setShowLogs(false);
      setLogs([]);
    } else if (trimmed === 'clear') {
      setLogs([]);
      setTerminalHistory([]);
      setShowLogs(false);
    } else if (trimmed === 'whoami') {
      setTerminalUserInfo({
        name: user?.name || 'Administrator',
        email: user?.email || 'admin@delivo.co.ke',
        role: user?.role || 'admin',
        ip: '127.0.0.1 (Local Session)'
      });
      setShowLogs(false);
      setLogs([]);
    } else if (trimmed === 'uptime') {
      setShowLogs(false);
      setLogs([]);
      setMockCommandOutput({
        title: 'UPTIME STATISTICS',
        lines: [
          'Host: delivo-core-vm-01',
          'Uptime: 4 days, 11 hours, 28 minutes, 14 seconds',
          'Users logged in: 1 admin session',
          'Load average: 0.08, 0.14, 0.11'
        ],
        type: 'info'
      });
    } else if (trimmed === 'ping') {
      setShowLogs(false);
      setLogs([]);
      setMockCommandOutput({
        title: 'PING delivo.co.ke (104.21.34.195) 56(84) bytes of data.',
        lines: [
          '64 bytes from 104.21.34.195: icmp_seq=1 ttl=56 time=12.4 ms',
          '64 bytes from 104.21.34.195: icmp_seq=2 ttl=56 time=11.9 ms',
          '64 bytes from 104.21.34.195: icmp_seq=3 ttl=56 time=13.1 ms',
          '--- delivo.co.ke ping statistics ---',
          '3 packets transmitted, 3 received, 0% packet loss, time 2004ms',
          'rtt min/avg/max/mdev = 11.9/12.4/13.1/0.51 ms'
        ],
        type: 'success'
      });
    } else if (trimmed === 'neofetch' || trimmed === 'sysinfo') {
      setShowLogs(false);
      setLogs([]);
      setMockCommandOutput({
        title: 'SYSTEM OVERVIEW (neofetch)',
        lines: [
          '  /\\_/\\     OS: Delivo Secure Kernel v1.0.0 (x86_64)',
          ' ( o.o )    Host: Hyper-V virtual-machine v2026',
          '  > ^ <     Uptime: 4d 11h 28m',
          '            Shell: delivo-sh v1.0.2',
          '            Terminal: browser-console (vt100)',
          '            CPU: Virtual Intel Xeon (4) @ 2.60GHz',
          '            Memory: 1145MB / 4096MB (27%)',
          '            Database: MongoDB 6.0 (Connected)',
          '            Backend: Node.js v24.11.0 (running)',
          '            Frontend: React 18 + Vite (SPA)'
        ],
        type: 'info'
      });
    } else if (trimmed === 'matrix') {
      setShowLogs(false);
      setLogs([]);
      setMockCommandOutput({
        title: 'MATRIX DIGITAL WATERFALL',
        lines: [
          '01000100 01000101 01001100 01001001 01010110 01001111',
          '1 0 1 1 0 0 1 0 1 0 1 1 1 0 0 1 0 1 1 0 1 0 1 1 1 0 1',
          '0 1 0 0 1 1 0 1 0 0 1 0 0 1 0 1 1 0 0 1 1 0 1 0 0 1 0',
          'SYSTEM STATUS: SECURE | CORE CLEARANCE GRANTED'
        ],
        type: 'matrix'
      });
    } else if (trimmed.startsWith('cowsay ')) {
      setShowLogs(false);
      setLogs([]);
      const cowText = cmdText.slice(7).trim() || 'Moo!';
      const bubbleLine = '-'.repeat(cowText.length + 4);
      setMockCommandOutput({
        title: 'COWSAY UTILITY',
        lines: [
          `  ${bubbleLine}`,
          `  < ${cowText} >`,
          `  ${bubbleLine}`,
          '         \\   ^__^',
          '          \\  (oo)\\_______',
          '             (__)\\       )\\/\\',
          '                 ||----w |',
          '                 ||     ||'
        ],
        type: 'info'
      });
    } else if (trimmed === 'fortune') {
      setShowLogs(false);
      setLogs([]);
      const fortunes = [
        "Computers are good at following instructions, but not at reading your mind.",
        "There are 10 types of people in the world: those who understand binary, and those who don't.",
        "Deleted code is debugged code.",
        "To err is human, but to really foul things up you need a computer.",
        "Complexity is the enemy of reliability.",
        "A good programmer looks both ways before crossing a one-way street.",
        "Don't worry if it doesn't work right. If everything did, you'd be out of a job.",
        "Talk is cheap. Show me the code. - Linus Torvalds"
      ];
      const selected = fortunes[Math.floor(Math.random() * fortunes.length)];
      setMockCommandOutput({
        title: 'FORTUNE COOKIE',
        lines: [
          selected
        ],
        type: 'info'
      });
    } else if (trimmed === 'weather') {
      setShowLogs(false);
      setLogs([]);
      setMockCommandOutput({
        title: 'METEOROLOGICAL REPORT (NAIROBI, KE)',
        lines: [
          '      \\ _ /      Condition: Sunny & Clear',
          '    - (   ) -    Temperature: 24°C / 75°F',
          '      / _ \\      Wind speed: 12 km/h ESE',
          '                 Humidity: 52%',
          '                 UV Index: 9 (Very High)',
          '                 Precipitation: 0% chance'
        ],
        type: 'success'
      });
    } else if (trimmed === 'sudo rm -rf /') {
      setShowLogs(false);
      setLogs([]);
      setMockCommandOutput({
        title: 'WARNING: SYSTEM DESTRUCTION INITIATED',
        lines: [
          '[CRITICAL] Target directory: /',
          '[SYSTEM] Initializing memory cluster wipe...',
          '......................................... Access Denied!',
          '[ERROR] Admin privilege override failed.',
          '[SECURITY] Threat logged. Security dispatch notified.'
        ],
        type: 'danger'
      });
    } else if (trimmed === 'exit') {
      navigate('/admin');
    } else if (trimmed === 'man' || trimmed.startsWith('man ')) {
      setShowLogs(false);
      setLogs([]);
      const subCmd = trimmed.replace('man ', '').trim();
      if (subCmd === 'man' || subCmd === '') {
        setMockCommandOutput({
          title: 'MANUAL PAGES - SYNTAX',
          lines: [
            'Usage: man <command>',
            'Available commands for manual:',
            '  man cat        - How to fetch system logs',
            '  man grep       - How to filter log lists',
            '  man theme      - How to switch layout theme',
            '  man whoami     - How to view session profile',
            '  man neofetch   - How to view machine specs'
          ],
          type: 'info'
        });
      } else if (subCmd === 'cat') {
        setMockCommandOutput({
          title: 'MANUAL: cat logs',
          lines: [
            'Description: Fetches and streams all audit logs in the terminal.',
            'Syntax: cat logs  (or simply "ls")',
            'Clearance: Admin Only'
          ],
          type: 'info'
        });
      } else if (subCmd === 'grep') {
        setMockCommandOutput({
          title: 'MANUAL: grep <term>',
          lines: [
            'Description: Searches and filters database log records by keyword.',
            'Syntax: grep <term>',
            'Example: grep delete-category'
          ],
          type: 'info'
        });
      } else if (subCmd === 'theme') {
        setMockCommandOutput({
          title: 'MANUAL: theme <name>',
          lines: [
            'Description: Switches the terminal visual aesthetic styling.',
            'Syntax: theme <name>',
            'Options: matrix | amber | cyberpunk | ubuntu',
            'Example: theme cyberpunk'
          ],
          type: 'info'
        });
      } else {
        setMockCommandOutput({
          title: `MANUAL: ${subCmd}`,
          lines: [
            `Description: Run the '${subCmd}' command directly to execute.`,
            'No additional arguments required.'
          ],
          type: 'info'
        });
      }
    } else if (trimmed.startsWith('theme ')) {
      const newTheme = trimmed.replace('theme ', '').trim();
      if (['matrix', 'amber', 'cyberpunk', 'ubuntu'].includes(newTheme)) {
        setTheme(newTheme);
      }
    } else if (trimmed === 'cat logs' || trimmed === 'ls') {
      setSearch('');
      setPage(1);
      setShowLogs(true);
    } else if (trimmed === 'sudo show-all') {
      setSearch('');
      setPage(1);
      setShowLogs(true);
    } else if (trimmed.startsWith('grep ')) {
      const term = cmdText.replace(/^grep\s+/i, '').replace(/['"]/g, '').trim();
      setSearch(term);
      setPage(1);
      setShowLogs(true);
    } else {
      // Treat generic input as search term
      setSearch(cmdText);
      setPage(1);
      setShowLogs(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput) return;
    handleCommandRun(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
    setShowTerminalHelp(false);
    setTerminalUserInfo(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'admin';
    return fullName.split(' ')[0];
  };

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <AdminDashboardLayout pageTitle="System Audit Logs">
      <div className={`terminal-container theme-${theme}`}>
        
        {/* Terminal Header Bar */}
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div className="terminal-title">
            <Terminal size={14} className="terminal-icon" />
            <span>admin@delivo-secure-shell:~ /audit-logs</span>
          </div>
          <div className="terminal-theme-selector">
            <Monitor size={14} style={{ marginRight: '6px' }} />
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="theme-select">
              <option value="matrix">Matrix Green</option>
              <option value="amber">CRT Amber</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="ubuntu">Ubuntu Aubergine</option>
            </select>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="terminal-body">
          {/* Welcome Banner */}
          <div className="terminal-banner">
            <pre className="ascii-art">
{`██████   ███████  ██      ██ ██    ██  ██████  
██   ██  ██       ██      ██  ██  ██  ██    ██ 
██   ██  █████    ██      ██   ████   ██    ██ 
██   ██  ██       ██      ██    ██    ██    ██ 
██████   ███████  ███████ ██    ██     ██████  `}
            </pre>
            <p className="banner-text">============================================================</p>
            <p className="banner-text">DELIVO SECURE AUDIT LOG TERMINAL (v1.0.2)</p>
            <p className="banner-text">UNAUTHORIZED ACCESS IS STRICTLY MONITORED AND LOGGED</p>
            <p className="banner-text">SYSTEM STATUS: READY | TYPE "man" FOR SHELL COMMAND MANUAL</p>
            <p className="banner-text">============================================================</p>
          </div>

          {/* Interactive Search Console */}
          <form onSubmit={handleSearchSubmit} className="terminal-input-line">
            <span className="terminal-prompt">admin@delivo:~$</span>
            <div className="input-wrapper">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Enter command...'
                className="terminal-input"
                autoComplete="off"
              />
              <button type="submit" className="terminal-btn-icon" title="Run Command">
                <Play size={14} />
              </button>
              {search && (
                <button type="button" onClick={handleClearSearch} className="terminal-btn-icon" title="Clear Filter">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <button type="button" onClick={() => fetchLogs(false)} className="terminal-refresh-btn" title="Refresh Logs">
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            </button>
          </form>

          {/* Logs Display Screen */}
          <div className="terminal-output-screen">
            {showTerminalHelp && (
              <div className="terminal-help-block" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <p className="text-warning">[HELP - SECURE AUDIT LOG SHELL COMMANDS]</p>
                <p>  cat logs               - Fetch and display the audit logs</p>
                <p>  grep &lt;search_term&gt;   - Filter log records by keyword/phrase</p>
                <p>  whoami                 - Show current logged-in administrator information</p>
                <p>  theme &lt;name&gt;         - Change visual layout (matrix, amber, cyberpunk, ubuntu)</p>
                <p>  clear                  - Wipe history logs and clear output screen</p>
                <p>  sudo show-all          - Pull all log records without filters</p>
                <p>  man &lt;command&gt;         - Learn details and usage of a specific command</p>
                <p>============================================================</p>
              </div>
            )}

            {terminalUserInfo && (
              <div className="terminal-user-block" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <p className="text-success">[WHOAMI - USER IDENTITY]</p>
                <p>  NAME:  {terminalUserInfo.name}</p>
                <p>  EMAIL: {terminalUserInfo.email}</p>
                <p>  ROLE:  {terminalUserInfo.role}</p>
                <p>  HOST:  {terminalUserInfo.ip}</p>
                <p>============================================================</p>
              </div>
            )}

            {mockCommandOutput && (
              <div className={`terminal-mock-block terminal-${mockCommandOutput.type}-block`} style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{mockCommandOutput.title}</p>
                {mockCommandOutput.lines.map((line, idx) => (
                  <p key={idx} style={{ whiteSpace: 'pre-wrap' }}>{line}</p>
                ))}
                <p>============================================================</p>
              </div>
            )}

            {loading ? (
              <div className="terminal-loading">
                <span className="cursor-blink">&gt; Scanning datastore...</span>
              </div>
            ) : !showLogs ? (
              <div className="terminal-empty-state" style={{ flexDirection: 'column', gap: '8px', color: 'var(--term-text-dim)' }}>
                <p className="cursor-blink">&gt; delivo-ssh:~$ awaiting command...</p>
                <p style={{ fontSize: '11px', opacity: 0.6 }}>Type "cat logs" to view logs or "help" for more command actions</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="terminal-empty-state">
                <p className="text-warning">[WARNING] No matching records found in audit logs.</p>
              </div>
            ) : (
              <div className="logs-list">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <div key={log._id} className={`log-entry ${isExpanded ? 'expanded' : ''}`}>
                      <div className="log-summary-row" onClick={() => toggleExpand(log._id)}>
                        <span className="log-timestamp">[{formatDate(log.timestamp)}]</span>
                        <span className="log-user">{getFirstName(log.adminName)} &gt;</span>
                        <span className="log-command">{log.command}</span>
                      </div>
                      
                      {isExpanded && (
                        <div className="log-details-block">
                          <div className="details-grid">
                            <div><span className="label">Admin User:</span> {log.adminName} ({log.adminEmail})</div>
                            <div><span className="label">Endpoint:</span> {log.action}</div>
                            <div><span className="label">Origin IP:</span> {log.ipAddress || 'Unknown'}</div>
                            <div className="full-width">
                              <span className="label">Agent Specs:</span> {log.userAgent}
                            </div>
                            {log.details && (
                              <div className="full-width">
                                <span className="label">API Response:</span> {log.details}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination styled like Terminal output status bar */}
          <div className="terminal-footer-pagination">
            <span className="status-indicator">
              SHELL_STATUS: OK | 
              <button 
                type="button" 
                onClick={() => setIsLive(!isLive)} 
                className="live-toggle-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isLive ? 'var(--term-text)' : 'var(--term-text-dim)',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  textDecoration: 'underline',
                  fontWeight: 'bold'
                }}
              >
                LIVE_POLLING: {isLive ? 'ACTIVE' : 'PAUSED'}
              </button>
            </span>
            <span className="record-count">PAGE {page} OF {totalPages}</span>
            <div className="pagination-arrows">
              <button 
                disabled={page <= 1 || loading} 
                onClick={() => setPage(prev => prev - 1)}
                className="pag-btn"
              >
                <ChevronLeft size={16} />
                <span>PREV</span>
              </button>
              <button 
                disabled={page >= totalPages || loading} 
                onClick={() => setPage(prev => prev + 1)}
                className="pag-btn"
              >
                <span>NEXT</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminLogs;
