import { useState, useEffect } from 'react'
import './App.css'
import { blockchainService } from './BlockchainService'
import { computeSHA256, computePerceptualHash, generateCID } from './utils/FileHasher'
import { ipfsService } from './utils/IpfsService'
import { scanUrlForMedia, detectPlatform } from './utils/CrossPlatformScanner'

function App() {
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [contentHash, setContentHash] = useState('')
  const [perceptualHash, setPerceptualHash] = useState('')
  const [ipfsCID, setIpfsCID] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [verifyPHash, setVerifyPHash] = useState('')
  const [pHashResult, setPHashResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [fileGenerating, setFileGenerating] = useState(false)
  const [ipfsUploading, setIpfsUploading] = useState(false)

  // ── Cross-Platform Scanner State ─────────────────────────────────────────
  const [platformUrl, setPlatformUrl] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const [detectedPlatformKey, setDetectedPlatformKey] = useState('')
  const [scannedImageUrl, setScannedImageUrl] = useState(null)
  const [scannedTitle, setScannedTitle] = useState('')
  const [scannedHashes, setScannedHashes] = useState(null)   // { sha256, pHash }
  const [scanVerdict, setScanVerdict] = useState(null)       // 'authentic' | 'fake' | 'unknown'
  const [scanContentInfo, setScanContentInfo] = useState(null) // on-chain record if found
  const [scanFile, setScanFile] = useState(null)             // File object for registration

  const connectWallet = async () => {
    try {
      setLoading(true)
      const addr = await blockchainService.init(isDemoMode)
      setAccount(addr)
      fetchLogs()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleDemoMode = () => {
    const newMode = !isDemoMode
    setIsDemoMode(newMode)
    setAccount('') // Reset account to force re-connection in new mode
    alert(newMode ? 'Gasless Demo Mode Enabled (Local Relayer)' : 'MetaMask Mode Enabled')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      setFileGenerating(true)
      const sha = await computeSHA256(file)
      const phash = await computePerceptualHash(file)
      setContentHash(sha)
      setPerceptualHash(phash)
      
      setIpfsUploading(true)
      const cid = await ipfsService.upload(file)
      setIpfsCID(cid)
      setIpfsUploading(false)
    } catch (err) {
      alert('File processing failed: ' + err.message)
      setIpfsUploading(false)
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
    if (!account) return alert('Connect wallet/relayer first!')
    try {
      setLoading(true)
      
      // Pre-check for exact and similar content to provide detailed feedback
      const existing = await blockchainService.getContent(contentHash)
      if (existing.timestamp !== 0n) {
        return alert('❌ EXACT DUPLICATE: This specific file is already registered.')
      }

      // Check for similarity (pHash match) - specifically catches AI manipulations
      const pHashExists = await blockchainService.contracts.ContentRegistry.perceptualHashExists(perceptualHash)
      if (pHashExists) {
        return alert('❌ MANIPULATION DETECTED: A similar image already exists in the provenance record. Registration rejected.')
      }

      await blockchainService.registerContent(contentHash, perceptualHash, ipfsCID)
      alert(isDemoMode ? '✔ Content Provenance Established (Gasless)' : '✔ Content Registered on Blockchain')
      fetchLogs()
    } catch (err) {
      alert('Registration failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyContent = async (e) => {
    e.preventDefault()
    if (!account) return alert('Connect wallet/relayer first!')
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
    if (!account) return alert('Connect wallet/relayer first!')
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

  // ── Cross-Platform Scanner Handler ───────────────────────────────────────
  const handleScanUrl = async () => {
    if (!platformUrl.trim()) return
    if (!account) return alert('Connect wallet/relayer first!')

    // Reset previous scan results
    setScannedImageUrl(null)
    setScannedTitle('')
    setScannedHashes(null)
    setScanVerdict(null)
    setScanContentInfo(null)
    setScanFile(null)
    setScanStatus('')

    // Detect platform immediately for badge display
    const { key } = detectPlatform(platformUrl)
    setDetectedPlatformKey(key)

    setScanLoading(true)
    try {
      // Step 1: Fetch media from URL
      const result = await scanUrlForMedia(platformUrl, (msg) => setScanStatus(msg))
      const { file, imageUrl, title, platform } = result

      setScannedImageUrl(imageUrl)
      setScannedTitle(title)
      setScanFile(file)

      // Step 2: Compute hashes
      setScanStatus('Computing cryptographic fingerprints…')
      const sha256 = await computeSHA256(file)
      const pHash  = await computePerceptualHash(file)
      setScannedHashes({ sha256, pHash })

      // Step 3: Check blockchain — exact match first
      setScanStatus('Querying blockchain registry…')
      const exactInfo = await blockchainService.getContentInfo(sha256)
      if (exactInfo) {
        setScanVerdict('authentic')
        setScanContentInfo(exactInfo)
        setScanStatus('✅ Exact match found on blockchain!')
        return
      }

      // Step 4: Perceptual hash check (catches manipulations)
      const pHashInfo = await blockchainService.getContentInfoByPHash(pHash)
      if (pHashInfo) {
        // pHash matched but SHA-256 didn't → content was modified
        setScanVerdict('fake')
        setScanContentInfo(pHashInfo)
        setScanStatus('⚠️ Similar content found — possible manipulation detected!')
        return
      }

      // Step 5: Not found anywhere
      setScanVerdict('unknown')
      setScanStatus('❓ Content not found in provenance registry.')
    } catch (err) {
      setScanStatus('Error: ' + err.message)
      setScanVerdict(null)
    } finally {
      setScanLoading(false)
    }
  }

  const handleRegisterFromScan = async () => {
    if (!scanFile || !scannedHashes) return
    if (!account) return alert('Connect wallet/relayer first!')
    try {
      setLoading(true)
      const cid = generateCID(scannedHashes.sha256)
      await blockchainService.registerContent(scannedHashes.sha256, scannedHashes.pHash, cid)
      alert('✅ Content provenance established from scanned URL!')
      setScanVerdict('authentic')
      setScanContentInfo({
        contentHash: scannedHashes.sha256,
        perceptualHash: scannedHashes.pHash,
        ipfsCID: cid,
        creator: account,
        timestamp: Math.floor(Date.now() / 1000),
      })
      fetchLogs()
    } catch (err) {
      alert('Registration failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className={`icon-pulse ${isDemoMode ? 'demo-active' : ''}`}></div>
          <h1>VeriChain Audit</h1>
          <div className="provenance-context">
            <span className="context-tag">Deepfake Protection</span>
            <span className="context-tag">Anti-Forgery</span>
          </div>
          <div className="demo-toggle-container">
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>DEMO MODE</span>
            <label className="switch">
              <input type="checkbox" checked={isDemoMode} onChange={toggleDemoMode} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div>
          {account ? (
            <span className={`status-badge ${isDemoMode ? 'status-gasless' : 'status-connected'}`}>
              {isDemoMode ? 'Relayer Active' : `${account.slice(0, 6)}...${account.slice(-4)}`}
            </span>
          ) : (
            <button className="connect-btn" onClick={connectWallet} disabled={loading}>
              {loading ? 'Initializing...' : (isDemoMode ? 'Activate Gasless' : 'Connect Wallet')}
            </button>
          )}
        </div>
      </header>

      <main className="app-container">
        <section className="section glass-card">
          <div className="actor-badge">ACTOR: CONTENT CREATOR</div>
          <h2 className="card-title">Establish Content Provenance</h2>
          <p className="card-subtitle">Securely register original content fingerprints on the immutable ledger (IPFS + Blockchain).</p>
          <div className="file-upload-zone">
            <input 
              type="file" 
              id="register-upload" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            <label htmlFor="register-upload" className="upload-label">
              {fileGenerating ? (ipfsUploading ? '🚀 Uploading to IPFS...' : '⚙️ Generating Hashes...') : '📁 Upload Original File'}
            </label>
          </div>
          
          <form onSubmit={registerContent} style={{ marginTop: '1.5rem' }}>
            <label className="input-label">Content Hash (SHA-256)</label>
            <input 
              placeholder="Auto-generated on upload" 
              value={contentHash}
              onChange={(e) => setContentHash(e.target.value)}
              required
            />
            <label className="input-label">Perceptual Hash (Cross-Modal)</label>
            <input 
              placeholder="Auto-generated on upload" 
              value={perceptualHash}
              onChange={(e) => setPerceptualHash(e.target.value)}
              required
            />
            <label className="input-label">IPFS CID (Off-Chain Storage)</label>
            <input 
              placeholder={ipfsUploading ? "Waiting for IPFS..." : "Auto-generated on upload"}
              value={ipfsCID}
              onChange={(e) => setIpfsCID(e.target.value)}
              style={{ color: ipfsUploading ? '#aaa' : '#fff' }}
              required
            />
            <button 
              type="submit" 
              disabled={loading || fileGenerating} 
              className={isDemoMode ? 'btn-gasless' : ''}
              style={{ width: '100%', marginTop: '1.25rem' }}
            >
              {loading ? (isDemoMode ? 'Sending Gasless Tx...' : 'Confirming Transaction...') : 'Establish Provenance'}
            </button>
          </form>
        </section>

        <section className="section glass-card">
          <div className="actor-badge">ACTOR: ONLINE PLATFORM</div>
          <h2 className="card-title">Verify Cross-Platform Authenticity</h2>
          <p className="card-subtitle">Validate fingerprints against the blockchain to detect manipulation or digital forgery.</p>
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
                className={isDemoMode ? 'btn-gasless' : ''}
              >
                Verify
              </button>
            </div>
            {verificationResult !== null && (
              <div className={`result-area ${verificationResult ? 'result-authentic' : 'result-fake'}`}>
                {verificationResult ? '✅ Content is AUTHENTIC (Exact Match Found)' : '❌ Content is FAKE or UNAUTHORIZED'}
              </div>
            )}
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Verify by Perceptual Hash (Cross-Modal)</label>
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
                className={isDemoMode ? 'btn-gasless' : ''}
              >
                Verify pHash
              </button>
            </div>
            {pHashResult !== null && (
              <div className={`result-area ${pHashResult ? 'result-authentic' : 'result-fake'}`}>
                {pHashResult ? '✅ pHash Matches Origin (Authentic)' : '❌ pHash Not Found (Restricted Content)'}
              </div>
            )}
          </div>
        </section>

        {/* ── Cross-Platform Fake Content Scanner ──────────────────────────── */}
        <section className="section glass-card grid-full">
          <div className="actor-badge">ACTOR: PLATFORM MODERATOR</div>
          <h2 className="card-title">🌐 Cross-Platform Fake Content Scanner</h2>
          <p className="card-subtitle">Paste a post URL from Instagram, Twitter/X, Facebook, Reddit, YouTube, or any direct image link. We'll fetch the media, fingerprint it, and check the blockchain in seconds.</p>

          {/* URL Input */}
          <div>
            <label className="input-label">Social Post or Direct Image URL</label>
            <div className="url-input-group">
              <input
                id="platform-url-input"
                type="url"
                placeholder="https://twitter.com/user/status/...  or  https://www.instagram.com/p/..."
                value={platformUrl}
                onChange={(e) => {
                  setPlatformUrl(e.target.value)
                  if (e.target.value) {
                    const { key } = detectPlatform(e.target.value)
                    setDetectedPlatformKey(key)
                  } else {
                    setDetectedPlatformKey('')
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleScanUrl()}
              />
              <button
                id="scan-url-btn"
                className="btn-scan"
                onClick={handleScanUrl}
                disabled={scanLoading || !platformUrl.trim()}
              >
                {scanLoading ? '⏳ Scanning…' : '🔍 Scan URL'}
              </button>
            </div>
            <div className="url-hint">
              <span>🐦 Twitter / X</span>
              <span>📸 Instagram</span>
              <span>📘 Facebook</span>
              <span>🤖 Reddit</span>
              <span>▶️ YouTube</span>
              <span>🎵 TikTok</span>
              <span>🖼️ Direct Image</span>
            </div>
          </div>

          {/* Platform detected badge */}
          {detectedPlatformKey && (
            <div className={`platform-badge ${detectedPlatformKey}`}>
              {detectedPlatformKey === 'twitter'   && '🐦 Twitter / X'}
              {detectedPlatformKey === 'instagram' && '📸 Instagram'}
              {detectedPlatformKey === 'facebook'  && '📘 Facebook'}
              {detectedPlatformKey === 'reddit'    && '🤖 Reddit'}
              {detectedPlatformKey === 'youtube'   && '▶️ YouTube'}
              {detectedPlatformKey === 'tiktok'    && '🎵 TikTok'}
              {detectedPlatformKey === 'direct'    && '🖼️ Direct Image'}
              {detectedPlatformKey === 'unknown'   && '🌐 Unknown Platform'}
            </div>
          )}

          {/* Scan status */}
          {scanStatus && (
            <div className="scan-status">
              {scanLoading && <div className="scan-spinner" />}
              {scanStatus}
            </div>
          )}

          {/* Media preview + hash summary */}
          {scannedImageUrl && scannedHashes && (
            <div className="scan-preview-card">
              <img
                src={scannedImageUrl}
                alt="Scanned media preview"
                className="scan-preview-img"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div className="scan-preview-meta">
                <div className="scan-preview-title" title={scannedTitle}>{scannedTitle}</div>
                <div className="scan-hash-row">
                  <span className="scan-hash-label">SHA-256</span>
                  <span className="scan-hash-value" title={scannedHashes.sha256}>{scannedHashes.sha256.slice(0, 40)}…</span>
                </div>
                <div className="scan-hash-row">
                  <span className="scan-hash-label">pHash</span>
                  <span className="scan-hash-value" title={scannedHashes.pHash}>{scannedHashes.pHash}</span>
                </div>
              </div>
            </div>
          )}

          {/* Verdict card */}
          {scanVerdict === 'authentic' && (
            <div className="verdict-card verdict-authentic">
              <div className="verdict-headline">✅ AUTHENTIC — Content Origin Verified</div>
              {scanContentInfo && (
                <>
                  <div className="verdict-info-grid">
                    <span className="verdict-info-key">Registered By</span>
                    <span className="verdict-info-val" title={scanContentInfo.creator}>{scanContentInfo.creator}</span>
                    <span className="verdict-info-key">Timestamp</span>
                    <span className="verdict-info-val">{new Date(scanContentInfo.timestamp * 1000).toLocaleString()}</span>
                    <span className="verdict-info-key">IPFS CID</span>
                    <span className="verdict-info-val" title={scanContentInfo.ipfsCID}>{scanContentInfo.ipfsCID.slice(0, 36)}…</span>
                  </div>
                  <hr className="verdict-divider" />
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>This content's fingerprint matches the on-chain provenance record. It has not been manipulated.</div>
                </>
              )}
            </div>
          )}

          {scanVerdict === 'fake' && (
            <div className="verdict-card verdict-fake">
              <div className="verdict-headline">⚠️ MANIPULATION DETECTED — Content May Be Altered</div>
              {scanContentInfo && (
                <>
                  <div className="verdict-info-grid">
                    <span className="verdict-info-key">Original By</span>
                    <span className="verdict-info-val" title={scanContentInfo.creator}>{scanContentInfo.creator}</span>
                    <span className="verdict-info-key">Registered</span>
                    <span className="verdict-info-val">{new Date(scanContentInfo.timestamp * 1000).toLocaleString()}</span>
                    <span className="verdict-info-key">Original Hash</span>
                    <span className="verdict-info-val" title={scanContentInfo.contentHash}>{scanContentInfo.contentHash.slice(0, 36)}…</span>
                  </div>
                  <hr className="verdict-divider" />
                  <div style={{ fontSize: '0.78rem', color: '#f87171' }}>⚠️ The perceptual fingerprint matches an existing record, but the exact hash differs — this suggests the content was cropped, re-encoded, watermarked, or AI-modified.</div>
                </>
              )}
            </div>
          )}

          {scanVerdict === 'unknown' && (
            <div className="verdict-card verdict-unknown">
              <div className="verdict-headline">❓ UNREGISTERED — Not Found in Provenance Registry</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                This content has no on-chain provenance record. It may be original but unregistered, or it may be inauthentic with no verifiable origin.
              </div>
              {scanFile && (
                <button
                  id="register-from-scan-btn"
                  className="btn-register-scan"
                  onClick={handleRegisterFromScan}
                  disabled={loading || !account}
                >
                  {loading ? 'Registering…' : '🔗 Register This Content on Blockchain'}
                </button>
              )}
            </div>
          )}
        </section>

        <section className="section glass-card" style={{ gridColumn: '1 / -1' }}>
          <div className="actor-badge">ACTOR: END USER / AUDITOR</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Universal Audit Ledger</h2>
            <button onClick={fetchLogs} className="btn-refresh" disabled={loading}>Refresh Logs</button>
          </div>
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
