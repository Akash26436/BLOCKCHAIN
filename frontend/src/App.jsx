import { useState, useEffect } from 'react'
import './App.css'
import { blockchainService } from './BlockchainService'
import { computeSHA256, computePerceptualHash, generateCID } from './utils/FileHasher'

function App() {
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [contentHash, setContentHash] = useState('')
  const [perceptualHash, setPerceptualHash] = useState('')
  const [ipfsCID, setIpfsCID] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [verifyPHash, setVerifyPHash] = useState('')
  const [pHashResult, setPHashResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [fileGenerating, setFileGenerating] = useState(false)

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      setFileGenerating(true)
      const sha = await computeSHA256(file)
      const phash = await computePerceptualHash(file)
      const cid = generateCID(sha)
      
      setContentHash(sha)
      setPerceptualHash(phash)
      setIpfsCID(cid)
    } catch (err) {
      alert('Hash generation failed: ' + err.message)
    } finally {
      setFileGenerating(false)
    }
  }

  const handleVerifyUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      setFileGenerating(true)
      const sha = await computeSHA256(file)
      const phash = await computePerceptualHash(file)
      
      setVerifyHash(sha)
      setVerifyPHash(phash)
    } catch (err) {
      alert('Hash generation failed: ' + err.message)
    } finally {
      setFileGenerating(false)
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

  const verifyByPHash = async (e) => {
    e.preventDefault()
    if (!account) return alert('Connect wallet first!')
    try {
      setLoading(true)
      const result = await blockchainService.verifyByPHash(verifyPHash)
      setPHashResult(result)
    } catch (err) {
      alert('pHash Verification failed: ' + err.message)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="icon-pulse"></div>
          <h1>VeriChain Audit</h1>
        </div>
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
          <h2 className="card-title">1. Register Original Content</h2>
          <div className="file-upload-zone">
            <input 
              type="file" 
              id="register-upload" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            <label htmlFor="register-upload" className="upload-label">
              {fileGenerating ? 'Generating Hashes...' : '📁 Upload Original File'}
            </label>
          </div>
          
          <form onSubmit={registerContent} style={{ marginTop: '1.5rem' }}>
            <label className="input-label">Content Hash (SHA-256)</label>
            <input 
              placeholder="e.g. 5eb63bbbe01... (Auto-generated on upload)" 
              value={contentHash}
              onChange={(e) => setContentHash(e.target.value)}
              required
            />
            <label className="input-label">Perceptual Hash</label>
            <input 
              placeholder="e.g. 8f2a... (Auto-generated on upload)" 
              value={perceptualHash}
              onChange={(e) => setPerceptualHash(e.target.value)}
              required
            />
            <label className="input-label">IPFS CID</label>
            <input 
              placeholder="e.g. bafybeig... (Auto-generated on upload)" 
              value={ipfsCID}
              onChange={(e) => setIpfsCID(e.target.value)}
              required
            />
            <button type="submit" disabled={loading || fileGenerating} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Confirming on Blockchain...' : 'Establish Provenance'}
            </button>
          </form>
        </section>

        <section className="section glass-card">
          <h2 className="card-title">2. Verify Media Authenticity</h2>
          <div className="file-upload-zone">
            <input 
              type="file" 
              id="verify-upload" 
              style={{ display: 'none' }} 
              onChange={handleVerifyUpload}
            />
            <label htmlFor="verify-upload" className="upload-label secondary">
              {fileGenerating ? 'Analyzing File...' : '🔍 Scan File to Verify'}
            </label>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Verify by SHA-256</label>
                <input 
                  placeholder="Paste Hash or Scan File" 
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <button 
                onClick={verifyContent} 
                disabled={loading || !verifyHash}
                style={{ height: '48px' }}
              >
                Verify
              </button>
            </div>
            {verificationResult !== null && (
              <div className={`result-area ${verificationResult ? 'result-authentic' : 'result-fake'}`}>
                {verificationResult ? '✅ Content is AUTHENTIC (Exact Match)' : '❌ Content is FAKE or UNAUTHORIZED'}
              </div>
            )}
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Verify by Perceptual Hash (Multi-Modal)</label>
                <input 
                  placeholder="Paste pHash or Scan File" 
                  value={verifyPHash}
                  onChange={(e) => setVerifyPHash(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <button 
                onClick={verifyByPHash} 
                disabled={loading || !verifyPHash}
                style={{ height: '48px' }}
              >
                Verify pHash
              </button>
            </div>
            {pHashResult !== null && (
              <div className={`result-area ${pHashResult ? 'result-authentic' : 'result-fake'}`}>
                {pHashResult ? '✅ pHash Matches Origin (Authentic)' : '❌ pHash Not Found Restricted'}
              </div>
            )}
          </div>
        </section>

        <section className="section glass-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="card-title">3. Universal Audit Trail</h2>
          <div className="logs-list">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className="log-item">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ color: '#4facfe' }}>{log.contentHash.slice(0, 32)}...</code>
                  <span className={log.result ? 'result-authentic' : 'result-fake'}>
                    {log.result ? 'VERIFIED' : 'FAILED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>
                  Auditor: {log.verifier} | {new Date(Number(log.timestamp) * 1000).toLocaleString()}
                </div>
              </div>
            )) : (
              <p style={{ opacity: 0.5, textAlign: 'center' }}>No audit logs currently available on the blockchain.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
