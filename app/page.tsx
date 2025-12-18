'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react'
import {
  FileText,
  Download,
  GitBranch
} from 'lucide-react'

export default function Page(): any {
  const [activeTab, setActiveTab] = useState<any>('input')
  const [inputs, setInputs] = useState<any>({
    companyName: '',
    transactionPrice: '',
    fairValue: '',
    numberOfShares: '',
    buyerType: '',
    sellerType: ''
  })
  const [analysis, setAnalysis] = useState<any>(null)

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setInputs((prev: any) => ({ ...prev, [name]: value }))
  }

  const runAnalysis = () => {
    const price = Number(inputs.transactionPrice || 0)
    const fv = Number(inputs.fairValue || 0)
    const shares = Number(inputs.numberOfShares || 0)

    const excessPerShare = Math.max(0, price - fv)
    const totalExcess = excessPerShare * shares

    let treatment = 'Non-compensatory'
    let conclusion = 'No compensation cost is required.'

    if (inputs.sellerType === 'employee' && excessPerShare > 0) {
      treatment = 'Compensatory'
      conclusion =
        'The excess of repurchase price over fair value represents compensation cost under ASC 718.'
    }

    setAnalysis({
      excessPerShare,
      totalExcess,
      treatment,
      conclusion
    })

    setActiveTab('results')
  }

  const generateMemo = () => {
    if (!analysis) return ''

    return `ACCOUNTING MEMORANDUM

Company: ${inputs.companyName}

Transaction Summary
- Transaction Price: $${inputs.transactionPrice}
- Fair Value: $${inputs.fairValue}
- Shares: ${inputs.numberOfShares}

Analysis
- Excess per Share: $${analysis.excessPerShare.toFixed(2)}
- Total Excess: $${analysis.totalExcess.toFixed(2)}

Conclusion
${analysis.conclusion}

Authoritative Guidance
ASC 718-20-35-7
`
  }

  const downloadMemo = () => {
    const blob = new Blob([generateMemo()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ASC_718_Secondary_Market_Memo.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderFlowchart = () => (
    <div style={{ background: '#ffffff', padding: 24, borderRadius: 8 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <GitBranch size={18} />
        ASC 718 Decision Framework
      </h2>

      <ol style={{ marginTop: 16 }}>
        <li>Is the seller an employee or service provider?</li>
        <li>Does the transaction price exceed fair value?</li>
        <li>Is the entity directly or indirectly involved?</li>
        <li>If yes to all, recognize compensation cost.</li>
      </ol>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          color: '#ffffff',
          padding: 24,
          borderRadius: 10,
          marginBottom: 24
        }}
      >
        <h1 style={{ margin: 0 }}>
          Secondary Market Transaction Analysis
        </h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          ASC 718 Compensation & Classification Tool
        </p>
      </header>

      <nav style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('input')}>Input</button>
        <button onClick={() => setActiveTab('flowchart')}>Flowchart</button>
        <button onClick={() => setActiveTab('results')}>Results</button>
        <button onClick={() => setActiveTab('memo')}>Memo</button>
      </nav>

      {activeTab === 'input' && (
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 8 }}>
          <input
            name="companyName"
            placeholder="Company Name"
            onChange={handleChange}
          />
          <br /><br />
          <input
            name="transactionPrice"
            placeholder="Transaction Price"
            onChange={handleChange}
          />
          <br /><br />
          <input
            name="fairValue"
            placeholder="Fair Value"
            onChange={handleChange}
          />
          <br /><br />
          <input
            name="numberOfShares"
            placeholder="Number of Shares"
            onChange={handleChange}
          />
          <br /><br />
          <select name="sellerType" onChange={handleChange}>
            <option value="">Seller Type</option>
            <option value="employee">Employee</option>
            <option value="investor">Investor</option>
          </select>
          <br /><br />
          <button onClick={runAnalysis}>Run Analysis</button>
        </div>
      )}

      {activeTab === 'flowchart' && renderFlowchart()}

      {activeTab === 'results' && analysis && (
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 8 }}>
          <h3>Results</h3>
          <p>Treatment: {analysis.treatment}</p>
          <p>Total Excess: ${analysis.totalExcess.toFixed(2)}</p>
        </div>
      )}

      {activeTab === 'memo' && (
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 8 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} />
            Accounting Memo
          </h2>

          <pre
            style={{
              marginTop: 16,
              background: '#f8fafc',
              padding: 16,
              borderRadius: 6,
              whiteSpace: 'pre-wrap'
            }}
          >
            {generateMemo()}
          </pre>

          <button
            onClick={downloadMemo}
            style={{
              marginTop: 16,
              padding: '8px 14px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6
            }}
          >
            <Download size={14} />
            Download Memo
          </button>
        </div>
      )}
    </div>
  )
}
