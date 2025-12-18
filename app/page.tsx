'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react'
import { FileText, Download, GitBranch } from 'lucide-react'

export default function Page(): any {
  const [activeTab, setActiveTab] = useState<any>('input')

  const [inputs, setInputs] = useState<any>({
    companyName: '',
    transactionDate: '',
    transactionPrice: '',
    fairValue: '',
    numberOfShares: '',
    buyerType: '',
    sellerType: '',
    entityInvolvement: '',
    shareStatus: '',
    monthsHeld: '',
    previouslyCost: '',
    isShortTermInducement: '',
    hasPattern: '',
    contingentEvent: ''
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
    const monthsHeld = Number(inputs.monthsHeld || 0)
    const prevCost = Number(inputs.previouslyCost || 0)

    const excessPerShare = Math.max(0, price - fv)
    const totalExcess = excessPerShare * shares

    let isCompensatory = false
    let requiresReclassification = false
    let accountingTreatment = 'No impact'
    let journalEntries: any[] = []
    let reasoning: any[] = []

    if (inputs.sellerType === 'investor') {
      accountingTreatment = 'Capital / Distribution'
      reasoning.push('Seller is an investor; ASC 718 does not apply.')

      if (inputs.buyerType === 'entity' && excessPerShare > 0) {
        reasoning.push('Entity repurchased shares above fair value.')
        journalEntries.push(
          { account: 'Dr. Treasury Stock / Equity', amount: fv * shares },
          { account: 'Dr. Retained Earnings (Distribution)', amount: totalExcess },
          { account: 'Cr. Cash', amount: price * shares }
        )
      }
    } else {
      reasoning.push('Seller is an employee or service provider.')

      if (excessPerShare > 0) {
        if (inputs.buyerType === 'entity') {
          isCompensatory = true
          accountingTreatment = 'Compensation'
          reasoning.push(
            'Entity repurchased shares above fair value; excess is compensation under ASC 718.'
          )

          journalEntries.push(
            { account: 'Dr. Compensation Expense', amount: totalExcess },
            { account: 'Dr. APIC', amount: fv * shares },
            { account: 'Cr. Cash', amount: price * shares }
          )
        } else if (inputs.entityInvolvement === 'facilitated') {
          isCompensatory = true
          accountingTreatment = 'Compensation'
          reasoning.push(
            'Entity facilitated third-party transaction; presumption of compensation.'
          )

          journalEntries.push(
            { account: 'Dr. Compensation Expense', amount: totalExcess },
            { account: 'Cr. APIC (Capital Contribution)', amount: totalExcess }
          )
        } else {
          accountingTreatment = 'Non-compensatory'
          reasoning.push('No direct or indirect entity involvement.')
        }
      }
    }

    if (inputs.shareStatus === 'immature' && monthsHeld < 6) {
      reasoning.push('Shares are immature.')

      if (inputs.hasPattern === 'yes') {
        requiresReclassification = true
        accountingTreatment += ' + Liability Reclassification'
        const reclassAmount = price * shares
        const incrementalComp = Math.max(0, reclassAmount - prevCost * shares)

        journalEntries.push(
          { account: 'Dr. Compensation Expense', amount: incrementalComp },
          { account: 'Dr. APIC', amount: prevCost * shares },
          { account: 'Cr. Share-Based Payment Liability', amount: reclassAmount }
        )
      }
    }

    setAnalysis({
      excessPerShare,
      totalExcess,
      isCompensatory,
      requiresReclassification,
      accountingTreatment,
      reasoning,
      journalEntries
    })

    setActiveTab('results')
  }

  const generateMemo = () => {
    if (!analysis) return ''

    return `ACCOUNTING MEMORANDUM

Company: ${inputs.companyName}
Transaction Date: ${inputs.transactionDate}

SUMMARY
Transaction price: $${inputs.transactionPrice}
Fair value: $${inputs.fairValue}
Shares: ${inputs.numberOfShares}

ANALYSIS
Excess per share: $${analysis.excessPerShare.toFixed(2)}
Total excess: $${analysis.totalExcess.toFixed(2)}

Treatment:
${analysis.accountingTreatment}

Key Reasoning:
${analysis.reasoning.map((r: any) => '- ' + r).join('\n')}

JOURNAL ENTRIES
${
  analysis.journalEntries.length === 0
    ? 'No entries required.'
    : analysis.journalEntries
        .map(
          (j: any) =>
            `${j.account.padEnd(45)} $${j.amount.toFixed(2)}`
        )
        .join('\n')
}

AUTHORITATIVE GUIDANCE
ASC 718-10-15-4
ASC 718-20-35-7
ASC 718-10-25-15
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

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1>Secondary Market Transaction Analysis</h1>

      <nav style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('input')}>Input</button>
        <button onClick={() => setActiveTab('results')}>Results</button>
        <button onClick={() => setActiveTab('memo')}>Memo</button>
        <button onClick={() => setActiveTab('flowchart')}>Flowchart</button>
      </nav>

      {activeTab === 'input' && (
        <div>
          {Object.keys(inputs).map((key: any) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <input
                name={key}
                placeholder={key}
                onChange={handleChange}
              />
            </div>
          ))}
          <button onClick={runAnalysis}>Run Analysis</button>
        </div>
      )}

      {activeTab === 'results' && analysis && (
        <div>
          <p>Treatment: {analysis.accountingTreatment}</p>
          <p>Total Excess: ${analysis.totalExcess.toFixed(2)}</p>
        </div>
      )}

      {activeTab === 'memo' && (
        <div>
          <h2>
            <FileText size={16} /> Accounting Memo
          </h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {generateMemo()}
          </pre>
          <button onClick={downloadMemo}>
            <Download size={14} /> Download Memo
          </button>
        </div>
      )}

      {activeTab === 'flowchart' && (
        <div>
          <h2>
            <GitBranch size={16} /> Decision Framework
          </h2>
          <ol>
            <li>Is seller an employee?</li>
            <li>Is price greater than fair value?</li>
            <li>Is entity involved?</li>
            <li>If yes to all, record compensation.</li>
          </ol>
        </div>
      )}
    </div>
  )
}
