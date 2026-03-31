import { useState, useEffect } from 'react'
import './App.css'
import { blockchainService } from './BlockchainService'

function App() {
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [contentHash, setContentHash] = useState('')
  const [perceptualHash, setPerceptualHash] = useState('')
  const [ipfsCID, setIpfsCID] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [logs, setLogs] = useState([])

  const connectWallet = async () => {
    try {
      setLoading(true)
      const addr = await blockchainService.init()
      setAccount(addr)
      fetchLogs()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const registerContent = async (e) => {
    e.preventDefault()
    if (!account) return alert('Connect wallet first!')
    try {
      setLoading(true)
      await blockchainService.registerContent(contentHash, perceptualHash, ipfsCID)
      alert('Content registered successfully!')
      fetchLogs()
    } catch (err) {
      alert('Registration failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyContent = async (e) => {
    e.preventDefault()
    if (!account) return alert('Connect wallet first!')
    try {
      setLoading(true)
      const result = await blockchainService.verifyContent(verifyHash)
      setVerificationResult(result)
    } catch (err) {
      alert('Verification failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const allLogs = await blockchainService.getLogs()
      setLogs([...allLogs].reverse())
    } catch (err) {
      console.error('Failed to fetch logs', err)
    }
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>VeriChain Audit</h1>
        <div>
          {account ? (
            <span className="status-badge status-connected">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          ) : (
            <button onClick={connectWallet} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      <main className="app-container">
        <section className="section glass-card">
          <h2 className="card-title">Register Content</h2>
          <form onSubmit={registerContent}>
            <input 
              placeholder="Content Hash (SHA-256)" 
              value={contentHash}
              onChange={(e) => setContentHash(e.target.value)}
              required
            />
            <input 
              placeholder="Perceptual Hash" 
              value={perceptualHash}
              onChange={(e) => setPerceptualHash(e.target.value)}
              required
            />
            <input 
              placeholder="IPFS CID" 
              value={ipfsCID}
              onChange={(e) => setIpfsCID(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Register on Blockchain'}
            </button>
          </form>
        </section>

        <section className="section glass-card">
          <h2 className="card-title">Verify Authenticity</h2>
          <form onSubmit={verifyContent}>
            <input 
              placeholder="Enter Content Hash to Verify" 
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              Verifying...
            </button>
          </form>

          {verificationResult !== null && (
            <div className={`result-area ${verificationResult ? 'result-authentic' : 'result-fake'}`}>
              {verificationResult ? '✅ Content is AUTHENTIC!' : '❌ Content is FAKE or UNAUTHORIZED!'}
            </div>
          )}
        </section>

        <section className="section glass-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="card-title">Audit Logs</h2>
          <div className="logs-list">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className="log-item">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{log.contentHash.slice(0, 20)}...</strong>
                  <span className={log.result ? 'result-authentic' : 'result-fake'}>
                    {log.result ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                  Verifier: {log.verifier} | {new Date(Number(log.timestamp) * 1000).toLocaleString()}
                </div>
              </div>
            )) : (
              <p style={{ opacity: 0.5, textAlign: 'center' }}>No verification logs found.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
